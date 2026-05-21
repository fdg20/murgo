import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export interface AuthUser {
  clerkId: string;
  userId: string;
  role: UserRole;
  email: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const clerkId = payload.sub as string;

      let user = await this.prisma.user.findUnique({
        where: { clerkId },
      });

      if (!user) {
        const clerkUser = await this.clerk.users.getUser(clerkId);
        const email =
          clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress ??
          clerkUser.emailAddresses[0]?.emailAddress ??
          `${clerkId}@clerk.local`;
        const role =
          (clerkUser.publicMetadata?.role as UserRole) ??
          (clerkUser.unsafeMetadata?.role as UserRole) ??
          UserRole.CUSTOMER;

        const existingByEmail = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingByEmail) {
          user = await this.prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              clerkId,
              firstName: clerkUser.firstName ?? existingByEmail.firstName,
              lastName: clerkUser.lastName ?? existingByEmail.lastName,
              avatarUrl: clerkUser.imageUrl ?? existingByEmail.avatarUrl,
              role: existingByEmail.role === UserRole.ADMIN ? UserRole.ADMIN : role,
            },
          });
        } else {
          user = await this.prisma.user.create({
            data: {
              clerkId,
              email,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              avatarUrl: clerkUser.imageUrl,
              role,
            },
          });
        }

        if (user.role === UserRole.CUSTOMER) {
          await this.prisma.customer.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
          });
        } else if (user.role === UserRole.RIDER) {
          await this.prisma.rider.upsert({
            where: { userId: user.id },
            create: { userId: user.id },
            update: {},
          });
        }
      }

      if (!user.isActive) {
        throw new ForbiddenException('Account is suspended');
      }

      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles?.length && !requiredRoles.includes(user.role)) {
        throw new ForbiddenException('Insufficient permissions');
      }

      request.user = {
        clerkId: user.clerkId,
        userId: user.id,
        role: user.role,
        email: user.email,
      } as AuthUser;

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
