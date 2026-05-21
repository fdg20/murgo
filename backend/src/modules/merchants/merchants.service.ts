import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeofenceService } from '../geofence/geofence.service';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { MerchantStatus, UserRole } from '@prisma/client';

@Injectable()
export class MerchantsService {
  constructor(
    private prisma: PrismaService,
    private geofence: GeofenceService,
  ) {}

  async browse(query?: { city?: string; search?: string }) {
    const where: Record<string, unknown> = {
      status: MerchantStatus.APPROVED,
      isOpen: true,
    };

    if (query?.city) where.city = query.city;
    if (query?.search) {
      where.OR = [
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.merchant.findMany({
      where,
      include: {
        products: {
          where: { isAvailable: true },
          take: 5,
        },
        _count: { select: { reviews: true } },
      },
      orderBy: { businessName: 'asc' },
    });
  }

  async findOne(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
      include: {
        products: {
          where: { isAvailable: true },
          include: { category: true },
        },
        categories: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          include: { user: { select: { firstName: true, lastName: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async register(
    user: AuthUser,
    data: {
      businessName: string;
      description?: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      latitude: number;
      longitude: number;
      logoUrl?: string;
      openingTime?: string;
      closingTime?: string;
    },
  ) {
    this.geofence.validateLocation(data.latitude, data.longitude);

    const existing = await this.prisma.merchant.findUnique({
      where: { userId: user.userId },
    });
    if (existing) {
      throw new BadRequestException('Merchant profile already exists');
    }

    await this.prisma.user.update({
      where: { id: user.userId },
      data: { role: UserRole.MERCHANT },
    });

    return this.prisma.merchant.create({
      data: {
        userId: user.userId,
        ...data,
        status: MerchantStatus.PENDING,
      },
    });
  }

  async getMyMerchant(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
      include: { categories: true, products: true },
    });
    if (!merchant) throw new NotFoundException('Merchant profile not found');
    return merchant;
  }

  async updateProfile(
    userId: string,
    data: Partial<{
      businessName: string;
      description: string;
      phone: string;
      logoUrl: string;
      coverUrl: string;
      isOpen: boolean;
      openingTime: string;
      closingTime: string;
    }>,
  ) {
    const merchant = await this.getMyMerchant(userId);
    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data,
    });
  }

  async getOrders(userId: string, status?: string) {
    const merchant = await this.getMyMerchant(userId);
    return this.prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        items: true,
        customer: { include: { user: true } },
        rider: { include: { user: true } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(userId: string, orderId: string, status: string) {
    const merchant = await this.getMyMerchant(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, merchantId: merchant.id },
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as never },
    });
  }

  async getAnalytics(userId: string) {
    const merchant = await this.getMyMerchant(userId);
    const [totalOrders, deliveredOrders, revenue] = await Promise.all([
      this.prisma.order.count({ where: { merchantId: merchant.id } }),
      this.prisma.order.count({
        where: { merchantId: merchant.id, status: 'DELIVERED' },
      }),
      this.prisma.order.aggregate({
        where: { merchantId: merchant.id, status: 'DELIVERED' },
        _sum: { subtotal: true },
      }),
    ]);

    return {
      totalOrders,
      deliveredOrders,
      totalRevenue: revenue._sum.subtotal ?? 0,
    };
  }

  async adminList(status?: MerchantStatus) {
    return this.prisma.merchant.findMany({
      where: status ? { status } : {},
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminUpdateStatus(id: string, status: MerchantStatus) {
    const merchant = await this.prisma.merchant.findUnique({ where: { id } });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return this.prisma.merchant.update({ where: { id }, data: { status } });
  }
}
