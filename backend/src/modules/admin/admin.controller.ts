import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { MerchantStatus, UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(ClerkAuthGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('merchants')
  getMerchants(@Query('status') status?: MerchantStatus) {
    return this.adminService.getMerchants(status);
  }

  @Patch('merchants/:id/status')
  updateMerchantStatus(
    @Param('id') id: string,
    @Body() body: { status: MerchantStatus },
  ) {
    return this.adminService.updateMerchantStatus(id, body.status);
  }

  @Get('customers')
  getCustomers() {
    return this.adminService.getCustomers();
  }

  @Get('riders')
  getRiders() {
    return this.adminService.getRiders();
  }

  @Patch('users/:id/suspend')
  suspendUser(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.adminService.suspendUser(id, body.isActive);
  }

  @Get('delivery-fees')
  getDeliveryFees() {
    return this.adminService.getDeliveryFees();
  }

  @Post('delivery-fees')
  createDeliveryFee(@Body() body: Record<string, number>) {
    return this.adminService.createDeliveryFee(body as never);
  }

  @Patch('delivery-fees/:id')
  updateDeliveryFee(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateDeliveryFee(id, body as never);
  }

  @Get('commissions')
  getCommissions() {
    return this.adminService.getCommissions();
  }

  @Patch('commissions/:id')
  updateCommission(
    @Param('id') id: string,
    @Body() body: { platformRate: number; merchantRate: number },
  ) {
    return this.adminService.updateCommission(id, body);
  }

  @Get('promo-codes')
  getPromoCodes() {
    return this.adminService.getAllPromoCodes();
  }

  @Get('orders')
  getOrders() {
    return this.adminService.getAllOrders();
  }
}
