import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('addresses')
@UseGuards(ClerkAuthGuard)
@Roles(UserRole.CUSTOMER)
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.addressesService.findAll(user);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      label?: string;
      street: string;
      barangay?: string;
      city: string;
      latitude: number;
      longitude: number;
      isDefault?: boolean;
    },
  ) {
    return this.addressesService.create(user, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.addressesService.update(user, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.addressesService.remove(user, id);
  }
}
