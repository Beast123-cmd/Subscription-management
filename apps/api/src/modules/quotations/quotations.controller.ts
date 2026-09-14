import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { TenantGuard } from '../auth/tenant.guard.js';
import { createQuotationSchema } from './quotations.schemas.js';
import { QuotationsService } from './quotations.service.js';
function parse<T>(s: z.ZodType<T>, v: unknown): T {
  const r = s.safeParse(v);
  if (!r.success) throw new BadRequestException(r.error.flatten());
  return r.data;
}
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly q: QuotationsService) {}
  @Get() @RequirePermissions('quotation.read') list(
    @CurrentUser() u: { activeOrganizationId: string },
  ) {
    return this.q.list(u.activeOrganizationId);
  }
  @Post() @RequirePermissions('quotation.create') create(
    @CurrentUser() u: { activeOrganizationId: string },
    @Body() b: unknown,
  ) {
    return this.q.create(u.activeOrganizationId, parse(createQuotationSchema, b));
  }
  @Get(':id') @RequirePermissions('quotation.read') one(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.q.find(u.activeOrganizationId, id);
  }
  @Post(':id/issue') @RequirePermissions('quotation.update') x(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.q.change(u.activeOrganizationId, id, 'ISSUED');
  }
  @Post(':id/accept') @RequirePermissions('quotation.update') a(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.q.change(u.activeOrganizationId, id, 'ACCEPTED');
  }
  @Post(':id/reject') @RequirePermissions('quotation.update') r(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.q.change(u.activeOrganizationId, id, 'REJECTED');
  }
  @Post(':id/cancel') @RequirePermissions('quotation.update') c(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.q.change(u.activeOrganizationId, id, 'CANCELLED');
  }
}
