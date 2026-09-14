import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { AuthService } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly auth: AuthService) {}

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
}
