import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
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

  @Get('access')
  @UseGuards(TenantGuard)
  access(@CurrentUser() currentUser: { userId: string; activeOrganizationId: string }) {
    return this.auth.getAccess(currentUser.userId, currentUser.activeOrganizationId);
  }

  @Get('roles')
  @UseGuards(TenantGuard, PermissionGuard)
  @RequirePermissions('role.read')
  roles(@CurrentUser() currentUser: { activeOrganizationId: string }) {
    return this.auth.listRoles(currentUser.activeOrganizationId);
  }

  @Post('members/:id/roles')
  @UseGuards(TenantGuard, PermissionGuard)
  @RequirePermissions('user.update')
  assignRoles(@CurrentUser() currentUser: { activeOrganizationId: string }, @Param('id') membershipId: string, @Body() body: unknown) {
    const parsed = z.object({ roleIds: z.array(z.uuid()).min(1) }).safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.auth.assignMemberRoles(currentUser.activeOrganizationId, membershipId, parsed.data.roleIds);
  }
}
