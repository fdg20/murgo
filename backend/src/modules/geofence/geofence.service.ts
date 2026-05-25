import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  validateServiceArea,
  isWithinActiveServiceArea,
  calculateDistanceKm,
  calculateDeliveryFee,
  estimateEtaMinutes,
  SERVICE_AREA_MESSAGE,
  SUPPORTED_CITIES,
  MURCIA_SERVICE_BOUNDARY,
  BACOLOD_SERVICE_BOUNDARY,
} from '../../common/utils/geofence';

const ACTIVE_SERVICE_AREAS = [
  {
    name: 'Murcia',
    boundaryGeo: MURCIA_SERVICE_BOUNDARY,
    centerLat: 10.604,
    centerLng: 123.041,
  },
  {
    name: 'Bacolod',
    boundaryGeo: BACOLOD_SERVICE_BOUNDARY,
    centerLat: 10.676,
    centerLng: 122.951,
  },
] as const;

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
    return isWithinActiveServiceArea(lat, lng);
  }

  /** Keep DB in sync with geofence.ts so deploys show new cities without a manual seed. */
  private async syncSupportedCities() {
    const supportedNames = SUPPORTED_CITIES.map((c) => c.name);
    await this.prisma.supportedCity.updateMany({
      where: { name: { notIn: [...supportedNames] } },
      data: { isActive: false },
    });
    for (const city of SUPPORTED_CITIES) {
      await this.prisma.supportedCity.upsert({
        where: { name: city.name },
        create: {
          name: city.name,
          latitude: city.lat,
          longitude: city.lng,
          isActive: true,
        },
        update: {
          latitude: city.lat,
          longitude: city.lng,
          isActive: true,
        },
      });
    }
  }

  private async syncServiceAreas() {
    const activeNames = ACTIVE_SERVICE_AREAS.map((a) => a.name);
    await this.prisma.serviceArea.updateMany({
      where: { name: { notIn: [...activeNames] } },
      data: { isActive: false },
    });
    for (const area of ACTIVE_SERVICE_AREAS) {
      await this.prisma.serviceArea.upsert({
        where: { name: area.name },
        create: {
          name: area.name,
          province: 'Negros Occidental',
          country: 'Philippines',
          boundaryGeo: area.boundaryGeo as object,
          centerLat: area.centerLat,
          centerLng: area.centerLng,
          isActive: true,
        },
        update: {
          boundaryGeo: area.boundaryGeo as object,
          centerLat: area.centerLat,
          centerLng: area.centerLng,
          isActive: true,
        },
      });
    }
  }

  async getSupportedCities() {
    await this.syncSupportedCities();
    return this.prisma.supportedCity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getServiceArea() {
    await this.syncServiceAreas();
    return this.prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
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
