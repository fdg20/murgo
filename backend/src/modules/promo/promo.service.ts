import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromoService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, subtotal: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!promo || !promo.isActive) {
      throw new NotFoundException('Invalid promo code');
    }
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new NotFoundException('Promo code expired');
    }
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new NotFoundException('Promo code usage limit reached');
    }
    if (subtotal < promo.minOrderAmount) {
      throw new NotFoundException(
        `Minimum order amount is ₱${promo.minOrderAmount}`,
      );
    }
    return promo;
  }

  async create(data: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    merchantId?: string;
    expiresAt?: Date;
  }) {
    return this.prisma.promoCode.create({
      data: { ...data, code: data.code.toUpperCase() },
    });
  }

  async findAll(merchantId?: string) {
    return this.prisma.promoCode.findMany({
      where: merchantId ? { merchantId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }
}
