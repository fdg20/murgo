import { Controller, Get, Patch, Body, UseGuards, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: { firstName?: string; lastName?: string; phone?: string },
  ) {
    return this.usersService.updateProfile(user, body);
  }

  @Post('role')
  setRole(
    @CurrentUser() user: AuthUser,
    @Body() body: { role: UserRole },
  ) {
    return this.usersService.setRole(user, body.role);
  }
}
