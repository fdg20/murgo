import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private async getMerchantByUserId(userId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { userId },
    });
    if (!merchant) throw new NotFoundException('Merchant not found');
    return merchant;
  }

  async search(query: string) {
    return this.prisma.product.findMany({
      where: {
        isAvailable: true,
        merchant: { status: 'APPROVED', isOpen: true },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { merchant: { select: { id: true, businessName: true, city: true } } },
      take: 50,
    });
  }

  async findByMerchant(merchantId: string) {
    return this.prisma.product.findMany({
      where: { merchantId, isAvailable: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    userId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      discountPrice?: number;
      stock: number;
      categoryId?: string;
      imageUrl?: string;
    },
  ) {
    const merchant = await this.getMerchantByUserId(userId);
    return this.prisma.product.create({
      data: { ...data, merchantId: merchant.id },
    });
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      discountPrice: number;
      stock: number;
      isAvailable: boolean;
      categoryId: string;
      imageUrl: string;
    }>,
  ) {
    const merchant = await this.getMerchantByUserId(userId);
    const product = await this.prisma.product.findFirst({
      where: { id, merchantId: merchant.id },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const merchant = await this.getMerchantByUserId(userId);
    const product = await this.prisma.product.findFirst({
      where: { id, merchantId: merchant.id },
    });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.product.delete({ where: { id } });
  }

  async createCategory(userId: string, name: string, sortOrder?: number) {
    const merchant = await this.getMerchantByUserId(userId);
    return this.prisma.category.create({
      data: { name, merchantId: merchant.id, sortOrder: sortOrder ?? 0 },
    });
  }

  async getCategories(userId: string) {
    const merchant = await this.getMerchantByUserId(userId);
    return this.prisma.category.findMany({
      where: { merchantId: merchant.id },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
