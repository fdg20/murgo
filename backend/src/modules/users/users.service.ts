import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { UserRole } from '@prisma/client';
import { createClerkClient } from '@clerk/backend';

@Injectable()
export class UsersService {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private prisma: PrismaService) {}

  async getProfile(user: AuthUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        customer: { include: { addresses: true } },
        merchant: true,
        rider: true,
      },
    });

    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  async updateProfile(
    user: AuthUser,
    data: { firstName?: string; lastName?: string; phone?: string },
  ) {
    return this.prisma.user.update({
      where: { id: user.userId },
      data,
    });
  }

  async setRole(user: AuthUser, role: UserRole) {
    const current = await this.prisma.user.findUnique({
      where: { id: user.userId },
    });
    if (!current) throw new NotFoundException('User not found');
    if (current.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot change role in the mobile app. Use the web admin panel.',
      );
    }
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin role must be assigned with promote-admin.');
    }

    await this.clerk.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role },
    });

    const updated = await this.prisma.user.update({
      where: { id: user.userId },
      data: { role },
    });

    if (role === UserRole.CUSTOMER) {
      await this.prisma.customer.upsert({
        where: { userId: user.userId },
        create: { userId: user.userId },
        update: {},
      });
    }

    if (role === UserRole.RIDER) {
      await this.prisma.rider.upsert({
        where: { userId: user.userId },
        create: { userId: user.userId },
        update: {},
      });
    }

    return updated;
  }
}
