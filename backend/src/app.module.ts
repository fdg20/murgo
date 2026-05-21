import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { GeofenceModule } from './modules/geofence/geofence.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { MerchantsModule } from './modules/merchants/merchants.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { RidersModule } from './modules/riders/riders.module';
import { PromoModule } from './modules/promo/promo.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { RoutesModule } from './modules/routes/routes.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    GeofenceModule,
    UsersModule,
    AddressesModule,
    MerchantsModule,
    ProductsModule,
    OrdersModule,
    RidersModule,
    PromoModule,
    AdminModule,
    NotificationsModule,
    UploadModule,
    RoutesModule,
    WebsocketModule,
  ],
})
export class AppModule {}
