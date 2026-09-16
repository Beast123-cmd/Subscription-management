import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { z } from 'zod';
import { PrismaService } from '../database/prisma.service.js';
import type {
  createItemSchema,
  createPlanSchema,
  createPriceSchema,
  updatePlanSchema,
} from './plans.schemas.js';
type PlanInput = z.infer<typeof createPlanSchema>;
type PlanUpdate = z.infer<typeof updatePlanSchema>;
type Item = z.infer<typeof createItemSchema>;
type Price = z.infer<typeof createPriceSchema>;
@Injectable()
export class PlansService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  async find(org: string, id: string) {
    const plan = await this.prisma.plan.findFirst({ where: { id, organizationId: org } });
    if (!plan) throw new NotFoundException('Plan not found.');
    return plan;
  }
  list(org: string) {
    return this.prisma.plan
      .findMany({ where: { organizationId: org }, orderBy: { createdAt: 'desc' } })
      .then((data) => ({ data }));
  }
  create(org: string, input: PlanInput) {
    this.validDates(input);
    return this.prisma.plan.create({ data: { organizationId: org, ...input } });
  }
  async update(org: string, id: string, input: PlanUpdate) {
    this.validDates(input);
    await this.find(org, id);
    return this.prisma.plan.update({ where: { id }, data: input });
  }
  async archive(org: string, id: string) {
    await this.find(org, id);
    return this.prisma.plan.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }
  async items(org: string, planId: string) {
    await this.find(org, planId);
    return {
      data: await this.prisma.planItem.findMany({ where: { organizationId: org, planId }, include: { product: { select: { name: true, productCode: true } } } }),
    };
  }
  async addItem(org: string, planId: string, input: Item) {
    await this.find(org, planId);
    const product = await this.prisma.product.findFirst({
      where: { id: input.productId, organizationId: org, status: 'ACTIVE' },
    });
    if (!product)
      throw new BadRequestException('Product must be active and belong to this organization.');
    if (input.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: input.variantId,
          organizationId: org,
          productId: input.productId,
          status: 'ACTIVE',
        },
      });
      if (!variant)
        throw new BadRequestException('Variant must be active and belong to the selected product.');
    }
    return this.prisma.planItem.create({ data: { organizationId: org, planId, ...input } });
  }
  async prices(org: string, planId: string) {
    await this.find(org, planId);
    return {
      data: await this.prisma.planPrice.findMany({
        where: { organizationId: org, planId },
        orderBy: { effectiveFrom: 'desc' },
      }),
    };
  }
  async addPrice(org: string, planId: string, input: Price) {
    await this.find(org, planId);
    this.validDates(input);
    return this.prisma.planPrice.create({ data: { organizationId: org, planId, ...input } });
  }
  private validDates(input: {
    startsAt?: string | null;
    endsAt?: string | null;
    effectiveFrom?: string;
    effectiveUntil?: string | null;
  }) {
    const a = input.startsAt ?? input.effectiveFrom;
    const b = input.endsAt ?? input.effectiveUntil;
    if (a && b && b <= a) throw new BadRequestException('End date must be later than start date.');
  }
}
