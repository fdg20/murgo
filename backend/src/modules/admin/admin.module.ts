import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MerchantsModule } from '../merchants/merchants.module';
import { GeofenceModule } from '../geofence/geofence.module';

@Module({
  imports: [MerchantsModule, GeofenceModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
