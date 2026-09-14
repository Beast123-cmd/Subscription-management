import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@subscription-management/database';
import type { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type { createInvoiceSchema, lineSchema } from './invoices.schemas.js';
type Create = z.infer<typeof createInvoiceSchema>;
type Line = z.infer<typeof lineSchema>;
@Injectable()
export class InvoicesService {
  constructor(private readonly p: PrismaService) {}
  async find(o: string, id: string) {
    const x = await this.p.invoice.findFirst({
      where: { id, organizationId: o },
      include: { items: true },
    });
    if (!x) throw new NotFoundException('Invoice not found.');
    return x;
  }
  list(o: string) {
    return this.p.invoice
      .findMany({ where: { organizationId: o }, orderBy: { createdAt: 'desc' } })
      .then((data) => ({ data }));
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
    const x = await this.find(o, id);
    if (x.status !== 'DRAFT') throw new ConflictException('Only draft invoices can change.');
    const sub = new Prisma.Decimal(i.unitPrice).mul(i.quantity);
    const d = new Prisma.Decimal(i.discountAmount ?? '0');
    const t = new Prisma.Decimal(i.taxAmount ?? '0');
    return this.p.invoiceItem.create({
      data: {
        invoiceId: id,
        ...i,
        discountAmount: d,
        taxAmount: t,
        lineSubtotal: sub,
        lineTotal: sub.minus(d).plus(t),
        currencyCode: x.currencyCode,
      },
    });
  }
  async finalize(o: string, id: string) {
    const x = await this.find(o, id);
    if (x.status !== 'DRAFT' || !x.items.length)
      throw new ConflictException('Only non-empty draft invoices can be finalized.');
    const subtotal = x.items.reduce((a, i) => a.add(i.lineSubtotal), new Prisma.Decimal(0));
    const discount = x.items.reduce((a, i) => a.add(i.discountAmount), new Prisma.Decimal(0));
    const tax = x.items.reduce((a, i) => a.add(i.taxAmount), new Prisma.Decimal(0));
    return this.p.invoice.update({
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
  }
  async void(o: string, id: string) {
    const x = await this.find(o, id);
    if (x.status !== 'FINALIZED')
      throw new ConflictException('Only finalized invoices can be voided.');
    return this.p.invoice.update({ where: { id }, data: { status: 'VOID', voidedAt: new Date() } });
  }
}
