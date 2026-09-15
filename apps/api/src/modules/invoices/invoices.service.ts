import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@subscription-management/database';
import type { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { createInvoiceSchema, lineSchema } from './invoices.schemas.js';
type Create = z.infer<typeof createInvoiceSchema>;
type Line = z.infer<typeof lineSchema>;
@Injectable()
export class InvoicesService {
  constructor(@Inject(PrismaService) private readonly p: PrismaService) {}
  async find(o: string, id: string) {
    const x = await this.p.invoice.findFirst({
      where: { id, organizationId: o },
      include: { items: true, customer: { select: { displayName: true } }, payments: { where: { status: 'SUCCEEDED' }, select: { amount: true } }, refunds: { where: { status: 'SUCCEEDED' }, select: { amount: true } } },
    });
    if (!x) throw new NotFoundException('Invoice not found.');
    return this.present(x);
  }
  list(o: string) {
    return this.p.invoice
      .findMany({ where: { organizationId: o }, include: { items: true, customer: { select: { displayName: true } }, payments: { where: { status: 'SUCCEEDED' }, select: { amount: true } }, refunds: { where: { status: 'SUCCEEDED' }, select: { amount: true } } }, orderBy: { createdAt: 'desc' } })
      .then((data) => ({ data: data.map((invoice) => this.present(invoice)) }));
  }
  private present<T extends { status: string; grandTotal: Prisma.Decimal; subtotal: Prisma.Decimal; discountTotal: Prisma.Decimal; taxTotal: Prisma.Decimal; customer: { displayName: string }; items: { lineSubtotal: Prisma.Decimal; discountAmount: Prisma.Decimal; taxAmount: Prisma.Decimal; lineTotal: Prisma.Decimal }[]; payments: {amount: Prisma.Decimal}[]; refunds: {amount: Prisma.Decimal}[] }>(invoice: T) {
    const sum = (rows: {amount: Prisma.Decimal}[]) => rows.reduce((total, row) => total.plus(row.amount), new Prisma.Decimal(0));
    const amountPaid = sum(invoice.payments).minus(sum(invoice.refunds));
    const totals = invoice.status === 'DRAFT' ? {
      subtotal: invoice.items.reduce((sum, item) => sum.plus(item.lineSubtotal), new Prisma.Decimal(0)),
      discountTotal: invoice.items.reduce((sum, item) => sum.plus(item.discountAmount), new Prisma.Decimal(0)),
      taxTotal: invoice.items.reduce((sum, item) => sum.plus(item.taxAmount), new Prisma.Decimal(0)),
      grandTotal: invoice.items.reduce((sum, item) => sum.plus(item.lineTotal), new Prisma.Decimal(0)),
    } : { subtotal: invoice.subtotal, discountTotal: invoice.discountTotal, taxTotal: invoice.taxTotal, grandTotal: invoice.grandTotal };
    const { payments, refunds, customer, ...record } = invoice;
    void payments;
    void refunds;
    void customer;
    return { ...record, ...totals, customerName: invoice.customer.displayName, amountPaid: amountPaid.toString(), amountDue: (invoice.status === 'FINALIZED' ? totals.grandTotal.minus(amountPaid) : new Prisma.Decimal(0)).toString() };
  }
  async yearlyTotals(o: string) {
    const organization = await this.p.organization.findUniqueOrThrow({
      where: { id: o },
      select: { timezone: true, defaultCurrencyCode: true },
    });
    const year = Number(new Intl.DateTimeFormat('en-US', {
      timeZone: organization.timezone,
      year: 'numeric',
    }).format(new Date()));
    const rows = await this.p.invoice.groupBy({
      by: ['currencyCode'],
      where: {
        organizationId: o,
        status: 'FINALIZED',
        issueDate: {
          gte: new Date(Date.UTC(year, 0, 1)),
          lt: new Date(Date.UTC(year + 1, 0, 1)),
        },
      },
      _sum: { grandTotal: true },
    });
    return {
      year,
      totals: rows.length
        ? rows.map((row) => ({ currencyCode: row.currencyCode, amount: row._sum.grandTotal?.toString() ?? '0' }))
        : [{ currencyCode: organization.defaultCurrencyCode, amount: '0' }],
    };
  }
  async create(o: string, i: Create) {
    if (i.dueDate < i.issueDate) throw new ConflictException('Due date cannot precede issue date.');
    const c = await this.p.customer.findFirst({
      where: { id: i.customerId, organizationId: o, status: 'ACTIVE' },
    });
    if (!c) throw new NotFoundException('Active customer not found.');
    return this.p.$transaction(async (tx) => {
      const [n] = await tx.$queryRaw<
        { next_value: bigint }[]
      >`INSERT INTO organization_sequences(organization_id,sequence_type,next_value,updated_at) VALUES(${o}::uuid,'INVOICE'::"OrganizationSequenceType",1,now()) ON CONFLICT(organization_id,sequence_type) DO UPDATE SET next_value=organization_sequences.next_value+1,updated_at=now() RETURNING next_value`;
      return tx.invoice.create({
        data: {
          organizationId: o,
          invoiceNumber: `INV-${String(n?.next_value ?? 1n).padStart(6, '0')}`,
          customerId: i.customerId,
          currencyCode: i.currencyCode,
          issueDate: new Date(i.issueDate),
          dueDate: new Date(i.dueDate),
        },
      });
    });
  }
  async addLine(o: string, id: string, i: Line) {
    return this.p.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${id}::uuid AND organization_id = ${o}::uuid FOR UPDATE`;
      const x = await tx.invoice.findFirst({ where: { id, organizationId: o }, select: { status: true, currencyCode: true } });
      if (!x) throw new NotFoundException('Invoice not found.');
      if (x.status !== 'DRAFT') throw new ConflictException('Only draft invoices can change.');
      const sub = new Prisma.Decimal(i.unitPrice).mul(i.quantity);
      const discount = i.discountId ? await tx.discount.findFirst({ where: { id: i.discountId, organizationId: o, status: 'ACTIVE' } }) : null;
      const tax = i.taxId ? await tx.tax.findFirst({ where: { id: i.taxId, organizationId: o, status: 'ACTIVE' } }) : null;
      if (i.discountId && !discount) throw new NotFoundException('Active discount not found.');
      if (i.taxId && !tax) throw new NotFoundException('Active tax not found.');
      const d = discount ? sub.mul(discount.rate).div(100) : new Prisma.Decimal(i.discountAmount ?? '0');
      if (d.gt(sub)) throw new ConflictException('Discount cannot exceed the line subtotal.');
      const t = tax ? sub.minus(d).mul(tax.rate).div(100) : new Prisma.Decimal(i.taxAmount ?? '0');
      return tx.invoiceItem.create({
        data: {
          invoiceId: id,
          description: i.description, quantity: i.quantity, unitPrice: i.unitPrice,
          discountAmount: d,
          taxAmount: t,
          lineSubtotal: sub,
          lineTotal: sub.minus(d).plus(t),
          currencyCode: x.currencyCode,
        },
      });
    });
  }
  async finalize(o: string, id: string) {
    return this.p.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${id}::uuid AND organization_id = ${o}::uuid FOR UPDATE`;
      const x = await tx.invoice.findFirst({ where: { id, organizationId: o }, include: { items: true } });
      if (!x) throw new NotFoundException('Invoice not found.');
      if (x.status !== 'DRAFT' || !x.items.length)
        throw new ConflictException('Only non-empty draft invoices can be finalized.');
      const subtotal = x.items.reduce((a, i) => a.add(i.lineSubtotal), new Prisma.Decimal(0));
      const discount = x.items.reduce((a, i) => a.add(i.discountAmount), new Prisma.Decimal(0));
      const tax = x.items.reduce((a, i) => a.add(i.taxAmount), new Prisma.Decimal(0));
      return tx.invoice.update({
        where: { id },
        data: {
          status: 'FINALIZED',
          subtotal,
          discountTotal: discount,
          taxTotal: tax,
          grandTotal: subtotal.minus(discount).plus(tax),
          finalizedAt: new Date(),
        },
      });
    });
  }
  async void(o: string, id: string) {
    return this.p.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${id}::uuid AND organization_id = ${o}::uuid FOR UPDATE`;
      const x = await tx.invoice.findFirst({ where: { id, organizationId: o } });
      if (!x) throw new NotFoundException('Invoice not found.');
      if (x.status !== 'FINALIZED') throw new ConflictException('Only finalized invoices can be voided.');
      if (await tx.payment.count({where: {invoiceId: id, organizationId: o, status: 'SUCCEEDED'}})) throw new ConflictException('An invoice with payments cannot be voided.');
      return tx.invoice.update({ where: { id }, data: { status: 'VOID', voidedAt: new Date() } });
    });
  }
}
