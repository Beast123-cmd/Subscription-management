import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { TenantGuard } from '../auth/tenant.guard.js';
import {
  createItemSchema,
  createPlanSchema,
  createPriceSchema,
  updatePlanSchema,
} from './plans.schemas.js';
import { PlansService } from './plans.service.js';
import { Inject } from '@nestjs/common';
function parse<T>(s: z.ZodType<T>, v: unknown): T {
  const r = s.safeParse(v);
  if (!r.success) throw new BadRequestException(r.error.flatten());
  return r.data;
}
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('plans')
export class PlansController {
  constructor(@Inject(PlansService) private readonly plans: PlansService) {}
  @Get() @RequirePermissions('plan.read') list(@CurrentUser() u: { activeOrganizationId: string }) {
    return this.plans.list(u.activeOrganizationId);
  }
  @Post() @RequirePermissions('plan.create') create(
    @CurrentUser() u: { activeOrganizationId: string },
    @Body() b: unknown,
  ) {
    return this.plans.create(u.activeOrganizationId, parse(createPlanSchema, b));
  }
  @Get(':id') @RequirePermissions('plan.read') one(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.plans.find(u.activeOrganizationId, id);
  }
  @Patch(':id') @RequirePermissions('plan.update') update(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() b: unknown,
  ) {
    return this.plans.update(u.activeOrganizationId, id, parse(updatePlanSchema, b));
  }
  @Post(':id/archive') @RequirePermissions('plan.update') archive(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.plans.archive(u.activeOrganizationId, id);
  }
  @Get(':id/items') @RequirePermissions('plan.read') items(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.plans.items(u.activeOrganizationId, id);
  }
  @Post(':id/items') @RequirePermissions('plan.update') item(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() b: unknown,
  ) {
    return this.plans.addItem(u.activeOrganizationId, id, parse(createItemSchema, b));
  }
  @Get(':id/prices') @RequirePermissions('plan.read') prices(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.plans.prices(u.activeOrganizationId, id);
  }
  @Post(':id/prices') @RequirePermissions('plan.update') price(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
    @Body() b: unknown,
  ) {
    return this.plans.addPrice(u.activeOrganizationId, id, parse(createPriceSchema, b));
  }
}
