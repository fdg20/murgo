import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ClerkAuthGuard, Roles } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/guards/clerk-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.productsService.search(q ?? '');
  }

  @Get('merchant/:merchantId')
  findByMerchant(@Param('merchantId') merchantId: string) {
    return this.productsService.findByMerchant(merchantId);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      name: string;
      description?: string;
      price: number;
      discountPrice?: number;
      stock: number;
      categoryId?: string;
      imageUrl?: string;
    },
  ) {
    return this.productsService.create(user.userId, body);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.productsService.update(user.userId, id, body);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.productsService.remove(user.userId, id);
  }

  @Post('categories')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  createCategory(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; sortOrder?: number },
  ) {
    return this.productsService.createCategory(
      user.userId,
      body.name,
      body.sortOrder,
    );
  }

  @Get('categories/me')
  @UseGuards(ClerkAuthGuard)
  @Roles(UserRole.MERCHANT)
  getCategories(@CurrentUser() user: AuthUser) {
    return this.productsService.getCategories(user.userId);
  }
}
