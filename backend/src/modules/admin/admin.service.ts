import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantsService } from '../merchants/merchants.service';
import { MerchantStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private merchantsService: MerchantsService,
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
}
