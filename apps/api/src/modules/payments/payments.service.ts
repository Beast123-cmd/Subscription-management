import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@subscription-management/database';
import type { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { createPaymentSchema, createRefundSchema } from './payments.schemas.js';
type Create = z.infer<typeof createPaymentSchema>;
type CreateRefund = z.infer<typeof createRefundSchema>;
@Injectable()
export class PaymentsService {
  constructor(@Inject(PrismaService) private readonly p: PrismaService) {}
  list(o: string) { return this.p.payment.findMany({ where: { organizationId: o }, include: { invoice: { select: { invoiceNumber: true, customer: { select: { displayName: true } } } } }, orderBy: { receivedAt: 'desc' } }).then((data) => ({ data: data.map((x) => ({ ...x, invoiceNumber: x.invoice.invoiceNumber, customerName: x.invoice.customer.displayName, paymentMethod: x.method, paymentDate: x.receivedAt, referenceNumber: x.reference, status: x.status === 'SUCCEEDED' ? 'SETTLED' : x.status })) })); }
  async find(o: string, id: string) { const x = await this.p.payment.findFirst({ where: { id, organizationId: o }, include: { invoice: true, refunds: true } }); if (!x) throw new NotFoundException('Payment not found.'); return x; }
  async create(o: string, i: Create, idempotencyKey: string) {
    return this.p.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { organizationId_idempotencyKey: { organizationId: o, idempotencyKey } } });
      if (existing) return existing;
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${i.invoiceId}::uuid AND organization_id = ${o}::uuid FOR UPDATE`;
      const invoice = await tx.invoice.findFirst({ where: { id: i.invoiceId, organizationId: o }, select: { status: true, currencyCode: true, grandTotal: true } });
      if (!invoice) throw new NotFoundException('Invoice not found.');
      if (invoice.status !== 'FINALIZED') throw new ConflictException('Payments require a finalized invoice.');
      const amount = new Prisma.Decimal(i.amount);
      const paid = await tx.payment.aggregate({ where: { organizationId: o, invoiceId: i.invoiceId, status: 'SUCCEEDED' }, _sum: { amount: true } });
      const refunded = await tx.refund.aggregate({ where: { organizationId: o, invoiceId: i.invoiceId, status: 'SUCCEEDED' }, _sum: { amount: true } });
      const due = invoice.grandTotal.minus(paid._sum.amount ?? 0).plus(refunded._sum.amount ?? 0);
      if (amount.lte(0) || amount.gt(due)) throw new ConflictException('Payment exceeds the outstanding invoice balance.');
      const [n] = await tx.$queryRaw<{ next_value: bigint }[]>`INSERT INTO organization_sequences(organization_id,sequence_type,next_value,updated_at) VALUES(${o}::uuid,'PAYMENT'::"OrganizationSequenceType",1,now()) ON CONFLICT(organization_id,sequence_type) DO UPDATE SET next_value=organization_sequences.next_value+1,updated_at=now() RETURNING next_value`;
      return tx.payment.create({ data: { organizationId: o, idempotencyKey, paymentNumber: `PAY-${String(n?.next_value ?? 1n).padStart(6, '0')}`, invoiceId: i.invoiceId, amount, currencyCode: invoice.currencyCode, method: i.method, reference: i.reference, notes: i.notes } });
    });
  }
  async createRefund(o: string, i: CreateRefund, idempotencyKey: string) {
    return this.p.$transaction(async (tx) => {
      const existing = await tx.refund.findUnique({ where: { organizationId_idempotencyKey: { organizationId: o, idempotencyKey } } });
      if (existing) return existing;
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${i.paymentId}::uuid AND organization_id = ${o}::uuid FOR UPDATE`;
      const payment = await tx.payment.findFirst({ where: { id: i.paymentId, organizationId: o, status: 'SUCCEEDED' } });
      if (!payment) throw new NotFoundException('Successful payment not found.');
      const amount = new Prisma.Decimal(i.amount);
      const refunded = await tx.refund.aggregate({ where: { paymentId: payment.id, status: 'SUCCEEDED' }, _sum: { amount: true } });
      if (amount.lte(0) || amount.gt(payment.amount.minus(refunded._sum.amount ?? 0))) throw new ConflictException('Refund exceeds the refundable payment balance.');
      const [n] = await tx.$queryRaw<{ next_value: bigint }[]>`INSERT INTO organization_sequences(organization_id,sequence_type,next_value,updated_at) VALUES(${o}::uuid,'REFUND'::"OrganizationSequenceType",1,now()) ON CONFLICT(organization_id,sequence_type) DO UPDATE SET next_value=organization_sequences.next_value+1,updated_at=now() RETURNING next_value`;
      return tx.refund.create({ data: { organizationId: o, idempotencyKey, refundNumber: `REF-${String(n?.next_value ?? 1n).padStart(6, '0')}`, invoiceId: payment.invoiceId, paymentId: payment.id, amount, currencyCode: payment.currencyCode, reason: i.reason } });
    });
  }
  listRefunds(o: string) { return this.p.refund.findMany({ where: { organizationId: o }, orderBy: { refundedAt: 'desc' } }).then((data) => ({ data })); }
}
