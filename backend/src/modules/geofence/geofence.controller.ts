import { Controller, Get, Post, Body } from '@nestjs/common';
import { GeofenceService } from './geofence.service';
import { SERVICE_AREA_MESSAGE } from '../../common/utils/geofence';

@Controller('geofence')
export class GeofenceController {
  constructor(private geofenceService: GeofenceService) {}

  @Get('cities')
  getCities() {
    return this.geofenceService.getSupportedCities();
  }

  @Get('service-area')
  getServiceArea() {
    return this.geofenceService.getServiceArea();
  }

  @Post('validate')
  validateLocation(@Body() body: { latitude: number; longitude: number }) {
    const { latitude, longitude } = body;
    try {
      this.geofenceService.validateLocation(latitude, longitude);
      return { valid: true };
    } catch {
      return {
        valid: false,
        message: SERVICE_AREA_MESSAGE,
      };
    }
  }
}
