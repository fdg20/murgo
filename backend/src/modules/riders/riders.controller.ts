import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RidersService } from './riders.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { OrderStatus, RiderStatus, UserRole } from '@prisma/client';

@Controller('riders')
@UseGuards(ClerkAuthGuard)
@Roles(UserRole.RIDER)
export class RidersController {
  constructor(private ridersService: RidersService) {}

  @Patch('status')
  setStatus(
    @CurrentUser() user: AuthUser,
    @Body() body: { status: RiderStatus },
  ) {
    return this.ridersService.setStatus(user.userId, body.status);
  }

  @Post('location')
  updateLocation(
    @CurrentUser() user: AuthUser,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.ridersService.updateLocation(
      user.userId,
      body.latitude,
      body.longitude,
    );
  }

  @Get('orders/available')
  getAvailableOrders(@CurrentUser() user: AuthUser) {
    return this.ridersService.getAvailableOrders(user.userId);
  }

  @Post('orders/:orderId/accept')
  acceptOrder(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.ridersService.acceptOrder(user.userId, orderId);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.ridersService.updateOrderStatus(
      user.userId,
      orderId,
      body.status,
    );
  }

  @Post('orders/:orderId/track')
  trackLocation(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body()
    body: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    },
  ) {
    return this.ridersService.trackLocation(
      user.userId,
      orderId,
      body.latitude,
      body.longitude,
      body.heading,
      body.speed,
    );
  }

  @Get('history')
  getHistory(@CurrentUser() user: AuthUser) {
    return this.ridersService.getDeliveryHistory(user.userId);
  }

  @Get('earnings')
  getEarnings(@CurrentUser() user: AuthUser) {
    return this.ridersService.getEarnings(user.userId);
  }
}
