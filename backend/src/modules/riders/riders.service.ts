import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeofenceService } from '../geofence/geofence.service';
import { OrderStatus, RiderStatus } from '@prisma/client';

@Injectable()
export class RidersService {
  constructor(
    private prisma: PrismaService,
    private geofence: GeofenceService,
  ) {}

  private async getRider(userId: string) {
    const rider = await this.prisma.rider.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!rider) throw new NotFoundException('Rider profile not found');
    return rider;
  }

  async setStatus(userId: string, status: RiderStatus) {
    const rider = await this.getRider(userId);
    return this.prisma.rider.update({
      where: { id: rider.id },
      data: { status },
    });
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    this.geofence.validateLocation(lat, lng);
    const rider = await this.getRider(userId);
    return this.prisma.rider.update({
      where: { id: rider.id },
      data: { currentLat: lat, currentLng: lng },
    });
  }

  async getAvailableOrders(userId: string) {
    const rider = await this.getRider(userId);
    if (rider.status !== RiderStatus.ONLINE) {
      throw new BadRequestException('Go online to see available orders');
    }

    return this.prisma.order.findMany({
      where: {
        status: OrderStatus.READY_FOR_PICKUP,
        riderId: null,
      },
      include: {
        merchant: true,
        address: true,
        items: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
  }

  async acceptOrder(userId: string, orderId: string) {
    const rider = await this.getRider(userId);
    if (rider.status !== RiderStatus.ONLINE) {
      throw new BadRequestException('Must be online to accept orders');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true, merchant: true },
    });
    if (!order || order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Order not available');
    }

    this.geofence.validateLocation(order.address.latitude, order.address.longitude);
    this.geofence.validateLocation(order.merchant.latitude, order.merchant.longitude);

    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          riderId: rider.id,
          status: OrderStatus.RIDER_ASSIGNED,
        },
        include: { merchant: true, address: true, items: true },
      }),
      this.prisma.rider.update({
        where: { id: rider.id },
        data: { status: RiderStatus.BUSY },
      }),
    ]).then(([updated]) => updated);
  }

  async updateOrderStatus(userId: string, orderId: string, status: OrderStatus) {
    const rider = await this.getRider(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, riderId: rider.id },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    if (status === OrderStatus.DELIVERED) {
      await this.prisma.rider.update({
        where: { id: rider.id },
        data: {
          status: RiderStatus.ONLINE,
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: order.deliveryFee * 0.8 },
        },
      });
    }

    return updated;
  }

  async trackLocation(
    userId: string,
    orderId: string,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number,
  ) {
    this.geofence.validateLocation(lat, lng);
    const rider = await this.getRider(userId);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, riderId: rider.id },
    });
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.rider.update({
      where: { id: rider.id },
      data: { currentLat: lat, currentLng: lng },
    });

    return this.prisma.trackingLocation.create({
      data: {
        orderId,
        riderId: rider.id,
        latitude: lat,
        longitude: lng,
        heading,
        speed,
      },
    });
  }

  async getDeliveryHistory(userId: string) {
    const rider = await this.getRider(userId);
    return this.prisma.order.findMany({
      where: { riderId: rider.id },
      include: { merchant: true, address: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEarnings(userId: string) {
    const rider = await this.getRider(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = await this.prisma.order.count({
      where: {
        riderId: rider.id,
        status: OrderStatus.DELIVERED,
        updatedAt: { gte: today },
      },
    });

    return {
      totalEarnings: rider.totalEarnings,
      totalDeliveries: rider.totalDeliveries,
      todayDeliveries,
    };
  }
}
