import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { TenantGuard } from '../auth/tenant.guard.js';
import { createSubscriptionSchema, reasonSchema } from './subscriptions.schemas.js';
import { SubscriptionsService } from './subscriptions.service.js';
function parse<T>(s: z.ZodType<T>, v: unknown): T {
  const r = s.safeParse(v);
  if (!r.success) throw new BadRequestException(r.error.flatten());
  return r.data;
}
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly s: SubscriptionsService) {}
  @Get() @RequirePermissions('subscription.read') list(
    @CurrentUser() u: { activeOrganizationId: string },
  ) {
    return this.s.list(u.activeOrganizationId);
  }
  @Post() @RequirePermissions('subscription.create') create(
    @CurrentUser() u: { userId: string; activeOrganizationId: string },
    @Body() b: unknown,
  ) {
    return this.s.create(u.activeOrganizationId, u.userId, parse(createSubscriptionSchema, b));
  }
  @Get(':id') @RequirePermissions('subscription.read') one(
    @CurrentUser() u: { activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.s.find(u.activeOrganizationId, id);
  }
  @Post(':id/confirm') @RequirePermissions('subscription.update') confirm(
    @CurrentUser() u: { userId: string; activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.s.transition(u.activeOrganizationId, id, u.userId, 'CONFIRMED');
  }
  @Post(':id/activate') @RequirePermissions('subscription.update') activate(
    @CurrentUser() u: { userId: string; activeOrganizationId: string },
    @Param('id') id: string,
  ) {
    return this.s.transition(u.activeOrganizationId, id, u.userId, 'ACTIVE');
  }
  @Post(':id/pause') @RequirePermissions('subscription.update') pause(
    @CurrentUser() u: { userId: string; activeOrganizationId: string },
    @Param('id') id: string,
    @Body() b: unknown,
  ) {
    return this.s.transition(
      u.activeOrganizationId,
      id,
      u.userId,
      'PAUSED',
      parse(reasonSchema, b).reason,
    );
  }
  @Post(':id/resume') @RequirePermissions('subscription.update') resume(
    @CurrentUser() u: { userId: string; activeOrganizationId: string },
    @Param('id') id: string,
    @Body() b: unknown,
  ) {
    return this.s.transition(
      u.activeOrganizationId,
      id,
      u.userId,
      'RESUMED',
      parse(reasonSchema, b).reason,
    );
  }
  @Post(':id/cancel') @RequirePermissions('subscription.update') cancel(
    @CurrentUser() u: { userId: string; activeOrganizationId: string },
    @Param('id') id: string,
    @Body() b: unknown,
  ) {
    return this.s.transition(
      u.activeOrganizationId,
      id,
      u.userId,
      'CANCELLED',
      parse(reasonSchema, b).reason,
    );
  }
}
