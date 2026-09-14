import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  createAddressSchema,
  createContactSchema,
  createCustomerSchema,
  updateAddressSchema,
  updateContactSchema,
  updateCustomerSchema,
} from './customer.schemas.js';
import { CustomersService } from './customers.service.js';

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
@Controller('customers')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Get()
  @RequirePermissions('customer.read')
  list(@CurrentUser() user: { activeOrganizationId: string }, @Query() query: unknown) {
    const { cursor, status } = parse(listSchema, query);
    return this.customers.list(user.activeOrganizationId, cursor, status);
  }

  @Post()
  @RequirePermissions('customer.create')
  create(@CurrentUser() user: { activeOrganizationId: string }, @Body() body: unknown) {
    return this.customers.create(user.activeOrganizationId, parse(createCustomerSchema, body));
  }

  @Get(':id')
  @RequirePermissions('customer.read')
  findOne(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.customers.findOne(user.activeOrganizationId, id);
  }

  @Patch(':id')
  @RequirePermissions('customer.update')
  update(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.customers.update(user.activeOrganizationId, id, parse(updateCustomerSchema, body));
  }

  @Post(':id/archive')
  @RequirePermissions('customer.update')
  archive(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.customers.archive(user.activeOrganizationId, id);
  }

  @Get(':id/contacts')
  @RequirePermissions('customer.read')
  listContacts(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.customers.listContacts(user.activeOrganizationId, id);
  }

  @Post(':id/contacts')
  @RequirePermissions('customer.update')
  createContact(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.customers.createContact(
      user.activeOrganizationId,
      id,
      parse(createContactSchema, body),
    );
  }

  @Patch(':customerId/contacts/:id')
  @RequirePermissions('customer.update')
  updateContact(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('customerId') customerId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.customers.updateContact(
      user.activeOrganizationId,
      customerId,
      id,
      parse(updateContactSchema, body),
    );
  }

  @Get(':id/addresses')
  @RequirePermissions('customer.read')
  listAddresses(@CurrentUser() user: { activeOrganizationId: string }, @Param('id') id: string) {
    return this.customers.listAddresses(user.activeOrganizationId, id);
  }

  @Post(':id/addresses')
  @RequirePermissions('customer.update')
  createAddress(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.customers.createAddress(
      user.activeOrganizationId,
      id,
      parse(createAddressSchema, body),
    );
  }

  @Patch(':customerId/addresses/:id')
  @RequirePermissions('customer.update')
  updateAddress(
    @CurrentUser() user: { activeOrganizationId: string },
    @Param('customerId') customerId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.customers.updateAddress(
      user.activeOrganizationId,
      customerId,
      id,
      parse(updateAddressSchema, body),
    );
  }
}
