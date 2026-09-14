import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequest } from './auth.types.js';
import { REQUIRED_PERMISSIONS } from './require-permissions.decorator.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.auth?.userId;
    const organizationId = request.organizationId;
    if (!userId || !organizationId)
      throw new ForbiddenException('An active organization is required.');

    const permissions = await this.prisma.membershipRole.findMany({
      where: { organizationId, membership: { userId, status: 'ACTIVE' } },
      select: {
        role: { select: { permissions: { select: { permission: { select: { code: true } } } } } },
      },
    });
    const granted = new Set(
      permissions.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code)),
    );
    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenException('You do not have permission for this action.');
    }
    return true;
  }
}
