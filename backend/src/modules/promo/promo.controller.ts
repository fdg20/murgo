import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PromoService } from './promo.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('promo')
export class PromoController {
  constructor(private promoService: PromoService) {}

  @Get('validate')
  validate(@Query('code') code: string, @Query('subtotal') subtotal: string) {
    return this.promoService.validate(code, parseFloat(subtotal));
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT, UserRole.ADMIN)
  create(@Body() body: Record<string, unknown>) {
    return this.promoService.create(body as never);
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT, UserRole.ADMIN)
  findAll(@Query('merchantId') merchantId?: string) {
    return this.promoService.findAll(merchantId);
  }
}
