import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/live',
})
export class LiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveGateway.name);
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const user = await this.prisma.user.findUnique({
        where: { clerkId: payload.sub as string },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.userId = user.id;
      client.data.role = user.role;
      client.join(`user:${user.id}`);
      client.join(`role:${user.role}`);

      this.logger.log(`Client connected: ${user.id} (${user.role})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data.userId}`);
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.join(`order:${data.orderId}`);
    return { event: 'joined', orderId: data.orderId };
  }

  @SubscribeMessage('rider:location')
  async handleRiderLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      orderId: string;
      latitude: number;
      longitude: number;
      heading?: number;
    },
  ) {
    const payload = {
      orderId: data.orderId,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading,
      timestamp: new Date().toISOString(),
    };

    await this.redis.set(
      `rider:location:${data.orderId}`,
      JSON.stringify(payload),
      300,
    );

    this.server.to(`order:${data.orderId}`).emit('rider:location', payload);
    return { success: true };
  }

  emitOrderUpdate(orderId: string, status: string, data?: Record<string, unknown>) {
    this.server.to(`order:${orderId}`).emit('order:status', {
      orderId,
      status,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitNewDeliveryRequest(order: unknown) {
    this.server.to('role:RIDER').emit('delivery:request', order);
  }
}
