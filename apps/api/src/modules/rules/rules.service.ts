import { ConflictException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Prisma } from '@subscription-management/database';
import { PrismaService } from '../database/prisma.service.js';
@Injectable()
export class RulesService {
  constructor(@Inject(PrismaService) private readonly p: PrismaService) {}
  taxes(o: string) { return this.p.tax.findMany({ where: { organizationId: o }, orderBy: { name: 'asc' } }).then((data) => ({ data })); }
  discounts(o: string) { return this.p.discount.findMany({ where: { organizationId: o }, orderBy: { name: 'asc' } }).then((data) => ({ data })); }
  async create(o: string, kind: 'tax' | 'discount', data: { name: string; rate: string }) { try { return kind === 'tax' ? await this.p.tax.create({ data: { organizationId: o, name: data.name, rate: new Prisma.Decimal(data.rate) } }) : await this.p.discount.create({ data: { organizationId: o, name: data.name, rate: new Prisma.Decimal(data.rate) } }); } catch { throw new ConflictException(`${kind} name already exists.`); } }
  async archive(o: string, kind: 'tax' | 'discount', id: string) { if (kind === 'tax') { const x = await this.p.tax.findFirst({ where: { id, organizationId: o } }); if (!x) throw new NotFoundException('tax not found.'); return this.p.tax.update({ where: { id }, data: { status: 'ARCHIVED' } }); } const x = await this.p.discount.findFirst({ where: { id, organizationId: o } }); if (!x) throw new NotFoundException('discount not found.'); return this.p.discount.update({ where: { id }, data: { status: 'ARCHIVED' } }); }
}
