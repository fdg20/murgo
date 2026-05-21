import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('merchants')
export class MerchantsController {
  constructor(private merchantsService: MerchantsService) {}

  @Get()
  browse(@Query('city') city?: string, @Query('search') search?: string) {
    return this.merchantsService.browse({ city, search });
  }

  @Get('me/profile')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.merchantsService.getMyMerchant(user.userId);
  }

  @Patch('me/profile')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.merchantsService.updateProfile(user.userId, body);
  }

  @Get('me/orders')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  getOrders(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
    return this.merchantsService.getOrders(user.userId, status);
  }

  @Patch('me/orders/:orderId/status')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  updateOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.merchantsService.updateOrderStatus(
      user.userId,
      orderId,
      body.status,
    );
  }

  @Get('me/analytics')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  getAnalytics(@CurrentUser() user: AuthUser) {
    return this.merchantsService.getAnalytics(user.userId);
  }

  @Post('register')
  @UseGuards(ClerkAuthGuard)
  register(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
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
    return this.merchantsService.register(user, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.merchantsService.findOne(id);
  }
}
