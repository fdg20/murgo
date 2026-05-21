import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('orders')
@UseGuards(ClerkAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post('checkout/preview')
  @Roles(UserRole.CUSTOMER)
  previewCheckout(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      merchantId: string;
      addressId: string;
      items: { productId: string; quantity: number }[];
      promoCode?: string;
    },
  ) {
    return this.ordersService.calculateCheckout(body, user.userId);
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      merchantId: string;
      addressId: string;
      items: { productId: string; quantity: number }[];
      promoCode?: string;
      notes?: string;
    },
  ) {
    return this.ordersService.createOrder(user, body);
  }

  @Get()
  @Roles(UserRole.CUSTOMER)
  findAll(@CurrentUser() user: AuthUser) {
    return this.ordersService.getCustomerOrders(user.userId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.getOrder(user.userId, id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.cancelOrder(user.userId, id);
  }
}
