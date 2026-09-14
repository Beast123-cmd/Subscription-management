import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { TenantGuard } from '../auth/tenant.guard.js';
import {
  createAttributeSchema,
  createAttributeValueSchema,
  createProductSchema,
  createVariantSchema,
  setVariantValuesSchema,
  updateProductSchema,
  updateVariantSchema,
} from './catalog.schemas.js';
import { CatalogService } from './catalog.service.js';

const listSchema = z.object({
  cursor: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}

@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('products')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @RequirePermissions('product.read')
  list(@CurrentUser() user: { activeOrganizationId: string }, @Query() query: unknown) {
    const { cursor, status } = parse(listSchema, query);
    return this.catalog.listProducts(user.activeOrganizationId, cursor, status);
  }

  @Post()
  @RequirePermissions('product.create')
  create(@CurrentUser() user: { activeOrganizationId: string }, @Body() body: unknown) {
    return this.catalog.createProduct(user.activeOrganizationId, parse(createProductSchema, body));
  }

  @Get(':id')
  @RequirePermissions('product.read')
  findOne(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.catalog.findProduct(user.activeOrganizationId, id);
  }

  @Patch(':id')
  @RequirePermissions('product.update')
  update(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.catalog.updateProduct(
      user.activeOrganizationId,
      id,
      parse(updateProductSchema, body),
    );
  }

  @Post(':id/archive')
  @RequirePermissions('product.update')
  archive(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.catalog.archiveProduct(user.activeOrganizationId, id);
  }

  @Get(':id/variants')
  @RequirePermissions('product.read')
  listVariants(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.catalog.listVariants(user.activeOrganizationId, id);
  }

  @Post(':id/variants')
  @RequirePermissions('product.update')
  createVariant(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.catalog.createVariant(
      user.activeOrganizationId,
      id,
      parse(createVariantSchema, body),
    );
  }

  @Patch(':productId/variants/:id')
  @RequirePermissions('product.update')
  updateVariant(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('productId') productId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.catalog.updateVariant(
      user.activeOrganizationId,
      productId,
      id,
      parse(updateVariantSchema, body),
    );
  }

  @Get(':id/attributes')
  @RequirePermissions('product.read')
  listAttributes(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.catalog.listAttributes(user.activeOrganizationId, id);
  }

  @Post(':id/attributes')
  @RequirePermissions('product.update')
  createAttribute(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.catalog.createAttribute(
      user.activeOrganizationId,
      id,
      parse(createAttributeSchema, body),
    );
  }

  @Post(':productId/attributes/:attributeId/values')
  @RequirePermissions('product.update')
  createAttributeValue(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('productId') productId: string,
    @Param('attributeId') attributeId: string,
    @Body() body: unknown,
  ) {
    return this.catalog.createAttributeValue(
      user.activeOrganizationId,
      productId,
      attributeId,
      parse(createAttributeValueSchema, body),
    );
  }

  @Put(':productId/variants/:variantId/attribute-values')
  @RequirePermissions('product.update')
  setVariantValues(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() body: unknown,
  ) {
    return this.catalog.setVariantValues(
      user.activeOrganizationId,
      productId,
      variantId,
      parse(setVariantValuesSchema, body),
    );
  }
}
