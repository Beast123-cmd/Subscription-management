import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@subscription-management/database';
import type { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { createQuotationSchema, convertQuotationSchema } from './quotations.schemas.js';
type Create = z.infer<typeof createQuotationSchema>;
type Convert = z.infer<typeof convertQuotationSchema>;
@Injectable()
export class QuotationsService {
  constructor(@Inject(PrismaService) private readonly p: PrismaService) {}
  list(org: string) {
    return this.p.quotation
      .findMany({ where: { organizationId: org }, orderBy: { createdAt: 'desc' } })
      .then((data) => ({ data }));
  }
  async find(org: string, id: string) {
    const q = await this.p.quotation.findFirst({
      where: { id, organizationId: org },
      include: { items: true },
    });
    if (!q) throw new NotFoundException('Quotation not found.');
    return q;
  }
  async create(org: string, i: Create) {
    const c = await this.p.customer.findFirst({
      where: { id: i.customerId, organizationId: org, status: 'ACTIVE' },
    });
    if (!c) throw new NotFoundException('Active customer not found.');
    const rows = i.items.map((x) => ({
      ...x,
      lineTotal: new Prisma.Decimal(x.unitPrice).mul(x.quantity),
    }));
    const total = rows.reduce((a, x) => a.add(x.lineTotal), new Prisma.Decimal(0));
    return this.p.$transaction(async (tx) => {
      const [n] = await tx.$queryRaw<
        { next_value: bigint }[]
      >`INSERT INTO organization_sequences(organization_id,sequence_type,next_value,updated_at) VALUES(${org}::uuid,'QUOTATION'::"OrganizationSequenceType",1,now()) ON CONFLICT(organization_id,sequence_type) DO UPDATE SET next_value=organization_sequences.next_value+1,updated_at=now() RETURNING next_value`;
      return tx.quotation.create({
        data: {
          organizationId: org,
          quotationNumber: `QTE-${String(n?.next_value ?? 1n).padStart(6, '0')}`,
          customerId: i.customerId,
          currencyCode: i.currencyCode,
          validUntil: new Date(i.validUntil),
          subtotal: total,
          grandTotal: total,
          items: { create: rows },
        },
      });
    });
  }
  async change(org: string, id: string, to: 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED') {
    const q = await this.find(org, id);
    const allowed: Record<string, string[]> = {
      DRAFT: ['ISSUED', 'CANCELLED'],
      ISSUED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    };
    if (!allowed[q.status]?.includes(to))
      throw new ConflictException('Invalid quotation transition.');
    return this.p.quotation.update({
      where: { id },
      data: { status: to, ...(to === 'ISSUED' ? { issueDate: new Date() } : {}) },
    });
  }
  async convert(org: string, id: string, userId: string, input: Convert) {
    if (input.billingStartDate < input.startDate) throw new ConflictException('Billing start date cannot precede subscription start date.');
    return this.p.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM quotations WHERE id = ${id}::uuid AND organization_id = ${org}::uuid FOR UPDATE`;
      const quote = await tx.quotation.findFirst({ where: { id, organizationId: org }, include: { items: true } });
      if (!quote) throw new NotFoundException('Quotation not found.');
      if (quote.status !== 'ACCEPTED') throw new ConflictException('Only accepted quotations can create a subscription.');
      if (await tx.subscription.findUnique({ where: { sourceQuotationId: id } })) throw new ConflictException('This quotation has already been converted.');
      const plan = await tx.plan.findFirst({ where: { id: input.planId, organizationId: org, status: 'ACTIVE' } });
      const customer = await tx.customer.findFirst({ where: { id: quote.customerId, organizationId: org, status: 'ACTIVE' } });
      if (!plan || !customer) throw new NotFoundException('Active customer or plan not found.');
      const [n] = await tx.$queryRaw<{ next_value: bigint }[]>`INSERT INTO organization_sequences(organization_id,sequence_type,next_value,updated_at) VALUES(${org}::uuid,'SUBSCRIPTION'::"OrganizationSequenceType",1,now()) ON CONFLICT(organization_id,sequence_type) DO UPDATE SET next_value=organization_sequences.next_value+1,updated_at=now() RETURNING next_value`;
      const subscription = await tx.subscription.create({ data: { organizationId: org, subscriptionNumber: `SUB-${String(n?.next_value ?? 1n).padStart(6, '0')}`, customerId: quote.customerId, planId: input.planId, sourceQuotationId: quote.id, startDate: new Date(input.startDate), billingStartDate: new Date(input.billingStartDate), currencyCode: quote.currencyCode, autoRenew: input.autoRenew ?? true } });
      await tx.subscriptionItem.createMany({ data: quote.items.map((item) => ({ subscriptionId: subscription.id, descriptionSnapshot: item.description, quantity: item.quantity, unitPrice: item.unitPrice, currencyCode: quote.currencyCode })) });
      await tx.subscriptionEvent.create({ data: { organizationId: org, subscriptionId: subscription.id, eventType: 'CREATED_FROM_QUOTATION', actorUserId: userId, metadata: { quotationId: quote.id, quotationNumber: quote.quotationNumber } } });
      return subscription;
    });
  }
}
