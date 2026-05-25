import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantsService } from '../merchants/merchants.service';
import { GeofenceService } from '../geofence/geofence.service';
import { MerchantStatus, OrderStatus, UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(
    private prisma: PrismaService,
    private merchantsService: MerchantsService,
    private geofence: GeofenceService,
  ) {}

  async getDashboard() {
    const [
      totalCustomers,
      totalMerchants,
      totalRiders,
      totalOrders,
      deliveredOrders,
      pendingMerchants,
      revenue,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.merchant.count({ where: { status: 'APPROVED' } }),
      this.prisma.rider.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.merchant.count({ where: { status: 'PENDING' } }),
      this.prisma.order.aggregate({
        where: { status: 'DELIVERED' },
        _sum: { total: true },
      }),
    ]);

    return {
      totalCustomers,
      totalMerchants,
      totalRiders,
      totalOrders,
      deliveredOrders,
      pendingMerchants,
      totalRevenue: revenue._sum.total ?? 0,
    };
  }

  async getMerchants(status?: MerchantStatus) {
    return this.merchantsService.adminList(status);
  }

  async updateMerchantStatus(id: string, status: MerchantStatus) {
    return this.merchantsService.adminUpdateStatus(id, status);
  }

  async getCustomers() {
    return this.prisma.customer.findMany({
      include: { user: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRiders() {
    return this.prisma.rider.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suspendUser(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async getDeliveryFees() {
    return this.prisma.deliveryFeeConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateDeliveryFee(
    id: string,
    data: Partial<{
      baseFee: number;
      perKmRate: number;
      flatFeeKm: number;
      flatFeeAmount: number;
      isActive: boolean;
    }>,
  ) {
    if (data.isActive) {
      await this.prisma.deliveryFeeConfig.updateMany({
        data: { isActive: false },
      });
    }
    return this.prisma.deliveryFeeConfig.update({ where: { id }, data });
  }

  async createDeliveryFee(data: {
    baseFee: number;
    perKmRate: number;
    flatFeeKm: number;
    flatFeeAmount: number;
  }) {
    return this.prisma.deliveryFeeConfig.create({ data });
  }

  async getCommissions() {
    return this.prisma.commissionConfig.findMany();
  }

  async updateCommission(
    id: string,
    data: { platformRate: number; merchantRate: number },
  ) {
    return this.prisma.commissionConfig.update({ where: { id }, data });
  }

  async getAllPromoCodes() {
    return this.prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        customer: { include: { user: true } },
        merchant: true,
        rider: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: { include: { user: true } },
        merchant: true,
        rider: { include: { user: true } },
      },
    });
  }

  async updateOrder(id: string, data: { notes?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        customer: { include: { user: true } },
        merchant: true,
        rider: { include: { user: true } },
      },
    });
  }

  async updateMerchant(
    id: string,
    data: Partial<{
      businessName: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      description: string;
    }>,
  ) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return this.prisma.merchant.update({
      where: { id },
      data,
      include: { user: true },
    });
  }

  async createMerchant(data: {
    email: string;
    businessName: string;
    phone: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    description?: string;
  }) {
    this.geofence.validateLocation(data.latitude, data.longitude);

    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException(
        'No account found for that email. The user must sign up in the app first.',
      );
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot assign a merchant profile to an admin account.');
    }

    const existing = await this.prisma.merchant.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      throw new BadRequestException('This user already has a merchant profile.');
    }

    await this.clerk.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role: UserRole.MERCHANT },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.MERCHANT },
    });

    return this.prisma.merchant.create({
      data: {
        userId: user.id,
        businessName: data.businessName,
        phone: data.phone,
        email: data.email.toLowerCase(),
        address: data.address,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        status: MerchantStatus.APPROVED,
      },
      include: { user: true },
    });
  }

  async removeMerchant(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');

    const orderCount = await this.prisma.order.count({
      where: { merchantId: id },
    });

    if (orderCount > 0) {
      await this.prisma.merchant.update({
        where: { id },
        data: { status: MerchantStatus.REJECTED, isOpen: false },
      });
      await this.setUserRole(merchant.user, UserRole.CUSTOMER);
      return { removed: false, message: 'Merchant deactivated (has existing orders).' };
    }

    await this.prisma.merchant.delete({ where: { id } });
    await this.setUserRole(merchant.user, UserRole.CUSTOMER);
    return { removed: true, message: 'Merchant removed.' };
  }

  async createCustomer(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException(
        'No account found for that email. The user must sign up in the app first.',
      );
    }
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot assign a customer profile to an admin account.');
    }

    const existing = await this.prisma.customer.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      throw new BadRequestException('This user already has a customer profile.');
    }

    await this.setUserRole(user, UserRole.CUSTOMER);

    return this.prisma.customer.create({
      data: { userId: user.id },
      include: { user: true, _count: { select: { orders: true } } },
    });
  }

  async removeCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const orderCount = await this.prisma.order.count({
      where: { customerId: id },
    });

    if (orderCount > 0) {
      await this.prisma.user.update({
        where: { id: customer.userId },
        data: { isActive: false },
      });
      return { removed: false, message: 'Customer suspended (has existing orders).' };
    }

    await this.prisma.customer.delete({ where: { id } });
    return { removed: true, message: 'Customer removed.' };
  }

  private async setUserRole(
    user: { id: string; clerkId: string },
    role: UserRole,
  ) {
    await this.clerk.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role },
    });

    if (role === UserRole.CUSTOMER) {
      await this.prisma.customer.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
    }
  }
}
