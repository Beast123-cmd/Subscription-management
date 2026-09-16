import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

  listMembers(organizationId: string) {
    return this.prisma.organizationMembership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        joinedAt: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true, status: true, lastLoginAt: true } },
        roles: { select: { role: { select: { id: true, name: true, code: true } } } },
      },
    }).then((data) => ({ data }));
  }

  async getAccess(userId: string, organizationId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId, organizationId, status: 'ACTIVE' },
      select: { roles: { select: { role: { select: { name: true, permissions: { select: { permission: { select: { code: true } } } } } } } } },
    });
    return {
      roles: membership?.roles.map(({ role }) => role.name) ?? [],
      permissions: [...new Set(membership?.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.code)) ?? [])],
    };
  }

  listRoles(organizationId: string) {
    return this.prisma.role.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        organizationId: true,
        name: true,
        code: true,
        description: true,
        isSystem: true,
        _count: { select: { permissions: true } },
      },
    }).then((roles) => ({
      data: roles.map(({ _count, ...role }) => ({ ...role, permissionsCount: _count.permissions })),
    }));
  }

  async assignMemberRoles(organizationId: string, membershipId: string, roleIds: string[]) {
    const membership = await this.prisma.organizationMembership.findFirst({ where: { id: membershipId, organizationId, status: 'ACTIVE' } });
    if (!membership) throw new NotFoundException('Active organization membership not found.');
    const roles = await this.prisma.role.findMany({ where: { organizationId, id: { in: roleIds } }, select: { id: true } });
    if (roles.length !== new Set(roleIds).size) throw new ConflictException('One or more roles do not belong to this organization.');
    return this.prisma.$transaction(async (tx) => {
      await tx.membershipRole.deleteMany({ where: { organizationId, membershipId } });
      await tx.membershipRole.createMany({ data: roles.map((role) => ({ organizationId, membershipId, roleId: role.id })) });
      return { membershipId, roleIds: roles.map((role) => role.id) };
    });
  }

  private sign(userId: string, activeOrganizationId?: string) {
    return this.jwt.signAsync({
      sub: userId,
      ...(activeOrganizationId ? { activeOrganizationId } : {}),
    });
  }
}
