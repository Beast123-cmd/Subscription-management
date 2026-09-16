import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { createSubscriptionSchema } from './subscriptions.schemas.js';
type Create = z.infer<typeof createSubscriptionSchema>;
@Injectable()
export class SubscriptionsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async find(org: string, id: string) {
    const s = await this.prisma.subscription.findFirst({
      where: { id, organizationId: org },
      include: { items: true },
    });
    if (!s) throw new NotFoundException('Subscription not found.');
    return s;
  }
  list(org: string) {
    return this.prisma.subscription
      .findMany({ where: { organizationId: org }, orderBy: { createdAt: 'desc' } })
      .then((data) => ({ data }));
  }
  async create(org: string, userId: string, i: Create) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: i.customerId, organizationId: org, status: 'ACTIVE' },
    });
    const plan = await this.prisma.plan.findFirst({
      where: { id: i.planId, organizationId: org, status: 'ACTIVE' },
    });
    if (!customer || !plan) throw new NotFoundException('Active customer or plan not found.');
    const price = await this.prisma.planPrice.findFirst({
      where: {
        organizationId: org,
        planId: i.planId,
        currencyCode: i.currencyCode,
        billingPeriod: i.billingPeriod,
        status: 'ACTIVE',
        effectiveFrom: { lte: new Date(i.startDate) },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: new Date(i.startDate) } }],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
    if (!price) throw new ConflictException('No effective plan price exists.');
    return this.prisma.$transaction(async (tx) => {
      const [n] = await tx.$queryRaw<
        { next_value: bigint }[]
      >`INSERT INTO organization_sequences (organization_id,sequence_type,next_value,updated_at) VALUES (${org}::uuid,'SUBSCRIPTION'::"OrganizationSequenceType",1,now()) ON CONFLICT (organization_id,sequence_type) DO UPDATE SET next_value=organization_sequences.next_value+1,updated_at=now() RETURNING next_value`;
      const s = await tx.subscription.create({
        data: {
          organizationId: org,
          subscriptionNumber: `SUB-${String(n?.next_value ?? 1n).padStart(6, '0')}`,
          customerId: i.customerId,
          planId: i.planId,
          startDate: new Date(i.startDate),
          billingStartDate: new Date(i.billingStartDate),
          currencyCode: i.currencyCode,
          paymentTerms: i.paymentTerms,
          autoRenew: i.autoRenew,
        },
      });
      await tx.subscriptionItem.create({
        data: {
          subscriptionId: s.id,
          descriptionSnapshot: plan.name,
          quantity: 1,
          unitPrice: price.amount,
          currencyCode: i.currencyCode,
        },
      });
      await tx.subscriptionEvent.create({
        data: {
          organizationId: org,
          subscriptionId: s.id,
          eventType: 'CREATED',
          actorUserId: userId,
        },
      });
      return s;
    });
  }
  async transition(
    org: string,
    id: string,
    userId: string,
    to: 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'RESUMED',
    reason?: string,
  ) {
    const next = to === 'RESUMED' ? 'ACTIVE' : to;
    const allowed: Record<string, string[]> = {
      DRAFT: ['CONFIRMED'],
      CONFIRMED: ['ACTIVE'],
      ACTIVE: ['PAUSED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'CANCELLED'],
    };
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM subscriptions WHERE id = ${id}::uuid AND organization_id = ${org}::uuid FOR UPDATE`;
      const s = await tx.subscription.findFirst({ where: { id, organizationId: org }, select: { status: true } });
      if (!s) throw new NotFoundException('Subscription not found.');
      if (!allowed[s.status]?.includes(next))
        throw new ConflictException(`Cannot transition ${s.status} to ${next}.`);
      const updated = await tx.subscription.update({ where: { id }, data: { status: next } });
      await tx.subscriptionEvent.create({
        data: {
          organizationId: org,
          subscriptionId: id,
          eventType: to,
          actorUserId: userId,
          metadata: { reason },
        },
      });
      if (['PAUSED', 'CANCELLED', 'RESUMED'].includes(to))
        await tx.subscriptionAmendment.create({
          data: {
            subscriptionId: id,
            amendmentType: to === 'RESUMED' ? 'RESUMED' : (to as 'PAUSED' | 'CANCELLED'),
            effectiveAt: new Date(),
            reason,
            beforeSnapshot: { status: s.status },
            afterSnapshot: { status: next },
          },
        });
      return updated;
    });
  }
}
