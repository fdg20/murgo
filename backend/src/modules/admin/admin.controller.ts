import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { MerchantStatus, OrderStatus, UserRole } from '@prisma/client';

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

  @Patch('merchants/:id')
  updateMerchant(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      businessName: string;
      phone: string;
      email: string;
      address: string;
      city: string;
      description: string;
    }>,
  ) {
    return this.adminService.updateMerchant(id, body);
  }

  @Post('merchants')
  createMerchant(
    @Body()
    body: {
      email: string;
      businessName: string;
      phone: string;
      address: string;
      city: string;
      latitude: number;
      longitude: number;
      description?: string;
    },
  ) {
    return this.adminService.createMerchant(body);
  }

  @Delete('merchants/:id')
  removeMerchant(@Param('id') id: string) {
    return this.adminService.removeMerchant(id);
  }

  @Get('customers')
  getCustomers() {
    return this.adminService.getCustomers();
  }

  @Post('customers')
  createCustomer(@Body() body: { email: string }) {
    return this.adminService.createCustomer(body.email);
  }

  @Delete('customers/:id')
  removeCustomer(@Param('id') id: string) {
    return this.adminService.removeCustomer(id);
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

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.adminService.updateOrderStatus(id, body.status);
  }

  @Patch('orders/:id/rider')
  assignRider(
    @Param('id') id: string,
    @Body() body: { riderId: string },
  ) {
    return this.adminService.assignRiderToOrder(id, body.riderId);
  }

  @Post('orders/:id/simulate-location')
  simulateRiderLocation(
    @Param('id') id: string,
    @Body() body: { preset: 'merchant' | 'customer' | 'midpoint' },
  ) {
    return this.adminService.simulateRiderLocation(id, body.preset);
  }

  @Patch('orders/:id')
  updateOrder(
    @Param('id') id: string,
    @Body() body: { notes?: string },
  ) {
    return this.adminService.updateOrder(id, body);
  }
}
