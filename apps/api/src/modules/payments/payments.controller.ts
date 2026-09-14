import { BadRequestException, Body, Controller, Get, Headers, Param, Post, UseGuards, Inject } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { TenantGuard } from '../auth/tenant.guard.js';
import { PaymentsService } from './payments.service.js';
import { createPaymentSchema, createRefundSchema } from './payments.schemas.js';
function parse<T>(s: z.ZodType<T>, v: unknown): T { const r = s.safeParse(v); if (!r.success) throw new BadRequestException(r.error.flatten()); return r.data; }
@UseGuards(JwtAuthGuard, TenantGuard, PermissionGuard)
@Controller('payments')
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly p: PaymentsService) {}
  @Get() @RequirePermissions('payment.read') list(@CurrentUser() u: { activeOrganizationId: string }) { return this.p.list(u.activeOrganizationId); }
  @Post() @RequirePermissions('payment.create') create(@CurrentUser() u: { activeOrganizationId: string }, @Headers('idempotency-key') key: string | undefined, @Body() b: unknown) { if (!key?.trim()) throw new BadRequestException('Idempotency-Key header is required.'); return this.p.create(u.activeOrganizationId, parse(createPaymentSchema, b), key.trim()); }
  @Get('refunds') @RequirePermissions('payment.read') refunds(@CurrentUser() u: { activeOrganizationId: string }) { return this.p.listRefunds(u.activeOrganizationId); }
  @Post('refunds') @RequirePermissions('payment.create') refund(@CurrentUser() u: { activeOrganizationId: string }, @Headers('idempotency-key') key: string | undefined, @Body() b: unknown) { if (!key?.trim()) throw new BadRequestException('Idempotency-Key header is required.'); return this.p.createRefund(u.activeOrganizationId, parse(createRefundSchema, b), key.trim()); }
  @Get(':id') @RequirePermissions('payment.read') one(@CurrentUser() u: { activeOrganizationId: string }, @Param('id') id: string) { return this.p.find(u.activeOrganizationId, id); }
}
