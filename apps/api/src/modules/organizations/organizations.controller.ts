import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Inject } from '@nestjs/common';

import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { TenantGuard } from '../auth/tenant.guard.js';
import { PermissionGuard } from '../auth/permission.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Get()
  list(@CurrentUser() currentUser: { userId: string }) {
    return this.auth
      .getCurrentUser(currentUser.userId)
      .then(({ organizations }) => ({ data: organizations }));
  }

  @Post(':id/select')
  select(@CurrentUser() currentUser: { userId: string }, @Param('id') organizationId: string) {
    return this.auth.selectOrganization(currentUser.userId, organizationId);
  }

  @Get('members')
  @UseGuards(TenantGuard, PermissionGuard)
  @RequirePermissions('user.read')
  members(@CurrentUser() currentUser: { activeOrganizationId: string }) {
    return this.auth.listMembers(currentUser.activeOrganizationId);
  }

  @Get('roles')
  @UseGuards(TenantGuard, PermissionGuard)
  @RequirePermissions('role.read')
  roles(@CurrentUser() currentUser: { activeOrganizationId: string }) {
    return this.auth.listRoles(currentUser.activeOrganizationId);
  }
}
