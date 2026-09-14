import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.auth?.userId;
    const organizationId = request.auth?.activeOrganizationId;

    if (!userId || !organizationId)
      throw new ForbiddenException('Select an active organization first.');

    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId, organizationId, status: 'ACTIVE', organization: { status: 'ACTIVE' } },
      select: { id: true },
    });

    if (!membership)
      throw new ForbiddenException('You do not have access to the active organization.');

    request.organizationId = organizationId;
    return true;
  }
}
