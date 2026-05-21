import { Module } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { GeofenceModule } from '../geofence/geofence.module';

@Module({
  imports: [GeofenceModule],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
