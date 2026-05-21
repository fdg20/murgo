import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeofenceService } from '../geofence/geofence.service';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private geofence: GeofenceService,
  ) {}

  private generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NO-${ts}-${rand}`;
  }

  async calculateCheckout(
    data: {
      merchantId: string;
      addressId: string;
      items: { productId: string; quantity: number }[];
      promoCode?: string;
    },
    userId: string,
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const merchant = await this.prisma.merchant.findUnique({
      where: { id: data.merchantId, status: 'APPROVED' },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    this.geofence.validateLocation(merchant.latitude, merchant.longitude);

    const address = await this.prisma.address.findFirst({
      where: { id: data.addressId, customerId: customer.id },
    });
    if (!address) throw new NotFoundException('Address not found');

    this.geofence.validateLocation(address.latitude, address.longitude);

    const productIds = data.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        merchantId: merchant.id,
        isAvailable: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products are unavailable');
    }

    let subtotal = 0;
    const lineItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      const price = product.discountPrice ?? product.price;
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;
      return {
        productId: product.id,
        name: product.name,
        price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    let discount = 0;
    let promoCodeId: string | undefined;

    if (data.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: data.promoCode.toUpperCase() },
      });
      if (promo?.isActive) {
        if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
          throw new BadRequestException(
            `Minimum order amount is ₱${promo.minOrderAmount}`,
          );
        }
        if (promo.discountType === 'PERCENTAGE') {
          discount = (subtotal * promo.discountValue) / 100;
          if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
        } else {
          discount = promo.discountValue;
        }
        promoCodeId = promo.id;
      }
    }

    const distanceKm = this.geofence.getDistanceKm(
      merchant.latitude,
      merchant.longitude,
      address.latitude,
      address.longitude,
    );

    const deliveryFee =
      await this.geofence.calculateOrderDeliveryFee(distanceKm);
    const total = Math.round((subtotal - discount + deliveryFee) * 100) / 100;
    const estimatedEta = this.geofence.getEtaMinutes(distanceKm);

    return {
      subtotal,
      discount,
      deliveryFee,
      total,
      distanceKm,
      estimatedEta,
      promoCodeId,
      items: lineItems,
    };
  }

  async createOrder(
    user: AuthUser,
    data: {
      merchantId: string;
      addressId: string;
      items: { productId: string; quantity: number }[];
      promoCode?: string;
      notes?: string;
    },
  ) {
    const checkout = await this.calculateCheckout(data, user.userId);
    const customer = await this.prisma.customer.findUnique({
      where: { userId: user.userId },
    })!;

    const order = await this.prisma.$transaction(async (tx) => {
      if (checkout.promoCodeId) {
        await tx.promoCode.update({
          where: { id: checkout.promoCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          customerId: customer!.id,
          merchantId: data.merchantId,
          addressId: data.addressId,
          subtotal: checkout.subtotal,
          discount: checkout.discount,
          deliveryFee: checkout.deliveryFee,
          total: checkout.total,
          distanceKm: checkout.distanceKm,
          estimatedEta: checkout.estimatedEta,
          promoCodeId: checkout.promoCodeId,
          notes: data.notes,
          status: OrderStatus.PENDING,
          items: {
            create: checkout.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
          merchant: true,
          address: true,
        },
      });
    });

    return order;
  }

  async getCustomerOrders(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.order.findMany({
      where: { customerId: customer.id },
      include: {
        items: true,
        merchant: { select: { id: true, businessName: true, logoUrl: true } },
        rider: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(userId: string, orderId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: customer.id },
      include: {
        items: true,
        merchant: true,
        address: true,
        rider: { include: { user: true } },
        trackingLocations: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.getOrder(userId, orderId);
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled');
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}
