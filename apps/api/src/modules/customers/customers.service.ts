import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@subscription-management/database';

import { PrismaService } from '../database/prisma.service.js';
import type {
  createAddressSchema,
  createContactSchema,
  createCustomerSchema,
  updateAddressSchema,
  updateContactSchema,
  updateCustomerSchema,
} from './customer.schemas.js';
import type { z } from 'zod';

type CreateCustomer = z.infer<typeof createCustomerSchema>;
type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
type CreateContact = z.infer<typeof createContactSchema>;
type UpdateContact = z.infer<typeof updateContactSchema>;
type CreateAddress = z.infer<typeof createAddressSchema>;
type UpdateAddress = z.infer<typeof updateAddressSchema>;

const customerSelect = {
  id: true,
  customerNumber: true,
  customerType: true,
  legalName: true,
  displayName: true,
  email: true,
  phone: true,
  taxIdentifier: true,
  defaultCurrencyCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

@Injectable()
export class CustomersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(organizationId: string, cursor?: string, status?: 'ACTIVE' | 'ARCHIVED') {
    const id = cursor && this.decodeCursor(cursor);
    const rows = await this.prisma.customer.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      select: customerSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...(id ? { cursor: { id }, skip: 1 } : {}),
      take: 26,
    });
    const data = rows.slice(0, 25);
    const last = data.at(-1);
    return {
      data,
      page: { limit: 25, nextCursor: rows.length > 25 && last ? this.encodeCursor(last.id) : null },
    };
  }

  async findOne(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId },
      select: customerSelect,
    });
    if (!customer) throw new NotFoundException('Customer not found.');
    return customer;
  }

  async create(organizationId: string, input: CreateCustomer) {
    return this.prisma.$transaction(async (tx) => {
      const [sequence] = await tx.$queryRaw<{ next_value: bigint }[]>`
        INSERT INTO organization_sequences (organization_id, sequence_type, next_value, updated_at)
        VALUES (${organizationId}::uuid, 'CUSTOMER'::"OrganizationSequenceType", 1, now())
        ON CONFLICT (organization_id, sequence_type)
        DO UPDATE SET next_value = organization_sequences.next_value + 1, updated_at = now()
        RETURNING next_value
      `;
      const customerNumber = `CUS-${String(sequence?.next_value ?? 1n).padStart(6, '0')}`;
      return tx.customer.create({
        data: { organizationId, customerNumber, ...input },
        select: customerSelect,
      });
    });
  }

  async update(organizationId: string, id: string, input: UpdateCustomer) {
    await this.findOne(organizationId, id);
    return this.prisma.customer.update({ where: { id }, data: input, select: customerSelect });
  }

  async archive(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.customer.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      select: customerSelect,
    });
  }

  async listContacts(organizationId: string, customerId: string) {
    await this.findOne(organizationId, customerId);
    return {
      data: await this.prisma.customerContact.findMany({
        where: { customerId },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      }),
    };
  }

  async createContact(organizationId: string, customerId: string, input: CreateContact) {
    await this.findOne(organizationId, customerId);
    return this.prisma.$transaction(async (tx) => {
      if (input.isPrimary)
        await tx.customerContact.updateMany({
          where: { customerId, isPrimary: true },
          data: { isPrimary: false },
        });
      return tx.customerContact.create({ data: { customerId, ...input } });
    });
  }

  async updateContact(
    organizationId: string,
    customerId: string,
    id: string,
    input: UpdateContact,
  ) {
    await this.findOne(organizationId, customerId);
    const contact = await this.prisma.customerContact.findFirst({ where: { id, customerId } });
    if (!contact) throw new NotFoundException('Customer contact not found.');
    return this.prisma.$transaction(async (tx) => {
      if (input.isPrimary)
        await tx.customerContact.updateMany({
          where: { customerId, isPrimary: true, NOT: { id } },
          data: { isPrimary: false },
        });
      return tx.customerContact.update({ where: { id }, data: input });
    });
  }

  async listAddresses(organizationId: string, customerId: string) {
    await this.findOne(organizationId, customerId);
    return {
      data: await this.prisma.customerAddress.findMany({
        where: { customerId },
        orderBy: { createdAt: 'asc' },
      }),
    };
  }

  async createAddress(organizationId: string, customerId: string, input: CreateAddress) {
    await this.findOne(organizationId, customerId);
    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault)
        await tx.customerAddress.updateMany({
          where: { customerId, addressType: input.addressType, isDefault: true },
          data: { isDefault: false },
        });
      return tx.customerAddress.create({ data: { customerId, ...input } });
    });
  }

  async updateAddress(
    organizationId: string,
    customerId: string,
    id: string,
    input: UpdateAddress,
  ) {
    await this.findOne(organizationId, customerId);
    const address = await this.prisma.customerAddress.findFirst({ where: { id, customerId } });
    if (!address) throw new NotFoundException('Customer address not found.');
    return this.prisma.$transaction(async (tx) => {
      const addressType = input.addressType ?? address.addressType;
      if (input.isDefault)
        await tx.customerAddress.updateMany({
          where: { customerId, addressType, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      return tx.customerAddress.update({ where: { id }, data: input });
    });
  }

  private encodeCursor(id: string) {
    return Buffer.from(id).toString('base64url');
  }

  private decodeCursor(cursor: string) {
    try {
      const id = Buffer.from(cursor, 'base64url').toString();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        throw new Error('Invalid UUID');
      }
      return id;
    } catch {
      throw new BadRequestException('Invalid cursor.');
    }
  }
}
