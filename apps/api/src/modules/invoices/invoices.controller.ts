import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { TenantGuard } from '../auth/tenant.guard.js';
import { createInvoiceSchema, lineSchema } from './invoices.schemas.js';
import { InvoicesService } from './invoices.service.js';
import { Inject } from '@nestjs/common';
function parse<T>(s: z.ZodType<T>, v: unknown): T {
  const r = s.safeParse(v);
  if (!r.success) throw new BadRequestException(r.error.flatten());
  return r.data;
}
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(@Inject(InvoicesService) private readonly i: InvoicesService) {}
  @Get() @RequirePermissions('invoice.read') list(
    @CurrentUser() u: { activeOrganizationId: string },
  ) {
    return this.i.list(u.activeOrganizationId);
  }
  @Get('summary') @RequirePermissions('invoice.read') summary(
    @CurrentUser() u: { activeOrganizationId: string },
  ) {
    return this.i.yearlyTotals(u.activeOrganizationId);
  }
  @Post() @RequirePermissions('invoice.create') create(
    @CurrentUser() u: { activeOrganizationId: string },
    @Body() b: unknown,
  ) {
    return this.i.create(u.activeOrganizationId, parse(createInvoiceSchema, b));
  }
  @Get(':id') @RequirePermissions('invoice.read') one(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.i.find(u.activeOrganizationId, id);
  }
  @Post(':id/items') @RequirePermissions('invoice.update') line(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() b: unknown,
  ) {
    return this.i.addLine(u.activeOrganizationId, id, parse(lineSchema, b));
  }
  @Post(':id/finalize') @RequirePermissions('invoice.update') finalize(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.i.finalize(u.activeOrganizationId, id);
  }
  @Post(':id/void') @RequirePermissions('invoice.update') void(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.i.void(u.activeOrganizationId, id);
  }
}
