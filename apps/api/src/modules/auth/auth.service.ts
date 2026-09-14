import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), status: 'ACTIVE' },
      include: {
        memberships: {
          where: { status: 'ACTIVE', organization: { status: 'ACTIVE' } },
          include: { organization: true },
        },
      },
    });

    if (!user || !(await compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return {
      accessToken: await this.sign(user.id),
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      organizations: user.memberships.map(({ organization }) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        defaultCurrencyCode: organization.defaultCurrencyCode,
        timezone: organization.timezone,
        status: organization.status,
      })),
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, status: 'ACTIVE' },
      include: {
        memberships: {
          where: { status: 'ACTIVE', organization: { status: 'ACTIVE' } },
          include: { organization: true },
        },
      },
    });
    if (!user) throw new UnauthorizedException('The user is unavailable.');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizations: user.memberships.map(({ organization }) => ({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        defaultCurrencyCode: organization.defaultCurrencyCode,
        timezone: organization.timezone,
        status: organization.status,
      })),
    };
  }

  async selectOrganization(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId, organizationId, status: 'ACTIVE', organization: { status: 'ACTIVE' } },
      select: { organizationId: true },
    });
    if (!membership)
      throw new UnauthorizedException('You do not have access to this organization.');

    return {
      accessToken: await this.sign(userId, membership.organizationId),
      activeOrganizationId: membership.organizationId,
    };
  }

  private sign(userId: string, activeOrganizationId?: string) {
    return this.jwt.signAsync({
      sub: userId,
      ...(activeOrganizationId ? { activeOrganizationId } : {}),
    });
  }
}
