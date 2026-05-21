import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeofenceService } from '../geofence/geofence.service';
import { AuthUser } from '../../common/guards/clerk-auth.guard';

@Injectable()
export class AddressesService {
  constructor(
    private prisma: PrismaService,
    private geofence: GeofenceService,
  ) {}

  private async getCustomerId(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return customer.id;
  }

  async findAll(user: AuthUser) {
    const customerId = await this.getCustomerId(user.userId);
    return this.prisma.address.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(
    user: AuthUser,
    data: {
      label?: string;
      street: string;
      barangay?: string;
      city: string;
      latitude: number;
      longitude: number;
      isDefault?: boolean;
    },
  ) {
    this.geofence.validateLocation(data.latitude, data.longitude);
    const customerId = await this.getCustomerId(user.userId);

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        customerId,
        label: data.label ?? 'Home',
        street: data.street,
        barangay: data.barangay,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async update(
    user: AuthUser,
    id: string,
    data: Partial<{
      label: string;
      street: string;
      barangay: string;
      city: string;
      latitude: number;
      longitude: number;
      isDefault: boolean;
    }>,
  ) {
    const customerId = await this.getCustomerId(user.userId);
    const address = await this.prisma.address.findFirst({
      where: { id, customerId },
    });
    if (!address) throw new NotFoundException('Address not found');

    if (data.latitude !== undefined && data.longitude !== undefined) {
      this.geofence.validateLocation(data.latitude, data.longitude);
    }

    if (data.isDefault) {
      await this.prisma.address.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({ where: { id }, data });
  }

  async remove(user: AuthUser, id: string) {
    const customerId = await this.getCustomerId(user.userId);
    const address = await this.prisma.address.findFirst({
      where: { id, customerId },
    });
    if (!address) throw new NotFoundException('Address not found');
    return this.prisma.address.delete({ where: { id } });
  }
}
