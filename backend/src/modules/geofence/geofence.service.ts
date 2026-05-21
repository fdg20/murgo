import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  validateServiceArea,
  isWithinMurciaServiceArea,
  calculateDistanceKm,
  calculateDeliveryFee,
  estimateEtaMinutes,
  SERVICE_AREA_MESSAGE,
  SUPPORTED_CITIES,
} from '../../common/utils/geofence';

@Injectable()
export class GeofenceService {
  constructor(private prisma: PrismaService) {}

  validateLocation(lat: number, lng: number) {
    const result = validateServiceArea(lat, lng);
    if (!result.valid) {
      throw new BadRequestException(result.message ?? SERVICE_AREA_MESSAGE);
    }
    return true;
  }

  isWithinServiceArea(lat: number, lng: number): boolean {
    return isWithinMurciaServiceArea(lat, lng);
  }

  async getSupportedCities() {
    const cities = await this.prisma.supportedCity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return cities.length ? cities : SUPPORTED_CITIES;
  }

  async getServiceArea() {
    return this.prisma.serviceArea.findFirst({
      where: { isActive: true, name: 'Murcia' },
    });
  }

  getDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    return Math.round(calculateDistanceKm(lat1, lng1, lat2, lng2) * 100) / 100;
  }

  async calculateOrderDeliveryFee(distanceKm: number): Promise<number> {
    const config = await this.prisma.deliveryFeeConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return calculateDeliveryFee({
        distanceKm,
        baseFee: 49,
        perKmRate: 10,
        flatFeeKm: 2,
        flatFeeAmount: 49,
      });
    }

    return calculateDeliveryFee({
      distanceKm,
      baseFee: config.baseFee,
      perKmRate: config.perKmRate,
      flatFeeKm: config.flatFeeKm,
      flatFeeAmount: config.flatFeeAmount,
    });
  }

  getEtaMinutes(distanceKm: number): number {
    return estimateEtaMinutes(distanceKm);
  }
}
