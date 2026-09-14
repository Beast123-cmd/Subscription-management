import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@subscription-management/database';
import type { z } from 'zod';

import { PrismaService } from '../database/prisma.service.js';
import type {
  createAttributeSchema,
  createAttributeValueSchema,
  createProductSchema,
  createVariantSchema,
  setVariantValuesSchema,
  updateProductSchema,
  updateVariantSchema,
} from './catalog.schemas.js';

type CreateProduct = z.infer<typeof createProductSchema>;
type UpdateProduct = z.infer<typeof updateProductSchema>;
type CreateVariant = z.infer<typeof createVariantSchema>;
type UpdateVariant = z.infer<typeof updateVariantSchema>;
type CreateAttribute = z.infer<typeof createAttributeSchema>;
type CreateAttributeValue = z.infer<typeof createAttributeValueSchema>;
type SetVariantValues = z.infer<typeof setVariantValuesSchema>;

const productSelect = {
  id: true,
  productCode: true,
  name: true,
  description: true,
  productType: true,
  costPrice: true,
  costCurrencyCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

@Injectable()
export class CatalogService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listProducts(organizationId: string, cursor?: string, status?: 'ACTIVE' | 'ARCHIVED') {
    const id = cursor && this.decodeCursor(cursor);
    const rows = await this.prisma.product.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      select: productSelect,
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

  async findProduct(organizationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
      select: productSelect,
    });
    if (!product) throw new NotFoundException('Product not found.');
    return product;
  }

  createProduct(organizationId: string, input: CreateProduct) {
    return this.prisma.product.create({
      data: { organizationId, ...input },
      select: productSelect,
    });
  }

  async updateProduct(organizationId: string, id: string, input: UpdateProduct) {
    await this.findProduct(organizationId, id);
    return this.prisma.product.update({ where: { id }, data: input, select: productSelect });
  }

  async archiveProduct(organizationId: string, id: string) {
    await this.findProduct(organizationId, id);
    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      select: productSelect,
    });
  }

  async listVariants(organizationId: string, productId: string) {
    await this.findProduct(organizationId, productId);
    return {
      data: await this.prisma.productVariant.findMany({
        where: { organizationId, productId },
        orderBy: { createdAt: 'asc' },
      }),
    };
  }

  async createVariant(organizationId: string, productId: string, input: CreateVariant) {
    await this.findProduct(organizationId, productId);
    return this.prisma.productVariant.create({ data: { organizationId, productId, ...input } });
  }

  async updateVariant(organizationId: string, productId: string, id: string, input: UpdateVariant) {
    await this.findProduct(organizationId, productId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id, organizationId, productId },
    });
    if (!variant) throw new NotFoundException('Product variant not found.');
    return this.prisma.productVariant.update({ where: { id }, data: input });
  }

  async listAttributes(organizationId: string, productId: string) {
    await this.findProduct(organizationId, productId);
    return {
      data: await this.prisma.productAttribute.findMany({
        where: { organizationId, productId },
        include: { values: { orderBy: { value: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      }),
    };
  }

  async createAttribute(organizationId: string, productId: string, input: CreateAttribute) {
    await this.findProduct(organizationId, productId);
    return this.prisma.productAttribute.create({ data: { organizationId, productId, ...input } });
  }

  async createAttributeValue(
    organizationId: string,
    productId: string,
    attributeId: string,
    input: CreateAttributeValue,
  ) {
    await this.findProduct(organizationId, productId);
    const attribute = await this.prisma.productAttribute.findFirst({
      where: { id: attributeId, organizationId, productId },
    });
    if (!attribute) throw new NotFoundException('Product attribute not found.');
    return this.prisma.productAttributeValue.create({ data: { attributeId, ...input } });
  }

  async setVariantValues(
    organizationId: string,
    productId: string,
    variantId: string,
    input: SetVariantValues,
  ) {
    await this.findProduct(organizationId, productId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, organizationId, productId },
    });
    if (!variant) throw new NotFoundException('Product variant not found.');
    const ids = [...new Set(input.attributeValueIds)];
    const values = await this.prisma.productAttributeValue.findMany({
      where: { id: { in: ids }, attribute: { organizationId, productId } },
      select: { id: true },
    });
    if (values.length !== ids.length)
      throw new BadRequestException('Attribute values must belong to this product.');
    return this.prisma.$transaction(async (tx) => {
      await tx.productVariantAttributeValue.deleteMany({ where: { variantId } });
      if (ids.length)
        await tx.productVariantAttributeValue.createMany({
          data: ids.map((attributeValueId) => ({ variantId, attributeValueId })),
        });
      return {
        data: await tx.productVariantAttributeValue.findMany({
          where: { variantId },
          include: { attributeValue: { include: { attribute: true } } },
        }),
      };
    });
  }

  private encodeCursor(id: string) {
    return Buffer.from(id).toString('base64url');
  }
  private decodeCursor(cursor: string) {
    try {
      const id = Buffer.from(cursor, 'base64url').toString();
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
        throw new Error('Invalid UUID');
      return id;
    } catch {
      throw new BadRequestException('Invalid cursor.');
    }
  }
}
