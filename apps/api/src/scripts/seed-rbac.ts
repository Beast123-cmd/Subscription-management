import { PrismaClient } from '@subscription-management/database';

const permissions = [
  ['organization', 'read', 'organization.read'],
  ['user', 'read', 'user.read'],
  ['user', 'create', 'user.create'],
  ['role', 'read', 'role.read'],
  ['role', 'manage', 'role.manage'],
  ['customer', 'read', 'customer.read'],
  ['customer', 'create', 'customer.create'],
  ['customer', 'update', 'customer.update'],
  ['product', 'read', 'product.read'],
  ['product', 'create', 'product.create'],
  ['product', 'update', 'product.update'],
  ['plan', 'read', 'plan.read'],
  ['plan', 'create', 'plan.create'],
  ['plan', 'update', 'plan.update'],
  ['subscription', 'read', 'subscription.read'],
  ['subscription', 'create', 'subscription.create'],
  ['subscription', 'update', 'subscription.update'],
  ['invoice', 'read', 'invoice.read'],
  ['invoice', 'create', 'invoice.create'],
  ['invoice', 'update', 'invoice.update'],
  ['payment', 'read', 'payment.read'],
  ['payment', 'create', 'payment.create'],
  ['tax', 'read', 'tax.read'], ['tax', 'manage', 'tax.manage'],
  ['discount', 'read', 'discount.read'], ['discount', 'manage', 'discount.manage'],
  ['quotation', 'read', 'quotation.read'],
  ['quotation', 'create', 'quotation.create'],
  ['quotation', 'update', 'quotation.update'],
] as const;

const prisma = new PrismaClient();

try {
  await prisma.$transaction(
    async (tx) => {
      const storedPermissions = await Promise.all(
        permissions.map(([resource, action, code]) =>
          tx.permission.upsert({
            where: { code },
            update: { resource, action },
            create: { resource, action, code },
          }),
        ),
      );

      const organizations = await tx.organization.findMany({
        include: { memberships: { orderBy: { createdAt: 'asc' } } },
      });

      for (const organization of organizations) {
        const admin = await tx.role.upsert({
          where: { organizationId_code: { organizationId: organization.id, code: 'ADMIN' } },
          update: {
            name: 'Admin',
            description: 'Full access to currently available platform operations.',
            isSystem: true,
          },
          create: {
            organizationId: organization.id,
            name: 'Admin',
            code: 'ADMIN',
            description: 'Full access to currently available platform operations.',
            isSystem: true,
          },
        });

        for (const permission of storedPermissions) {
          await tx.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: admin.id, permissionId: permission.id } },
            update: {},
            create: { roleId: admin.id, permissionId: permission.id },
          });
        }

        const [membership] = organization.memberships;
        if (organization.memberships.length === 1 && membership) {
          await tx.membershipRole.upsert({
            where: { membershipId_roleId: { membershipId: membership.id, roleId: admin.id } },
            update: {},
            create: {
              organizationId: organization.id,
              membershipId: membership.id,
              roleId: admin.id,
            },
          });
        } else if (organization.memberships.length > 1) {
          console.warn(
            `Skipped automatic Admin assignment for ${organization.id}: more than one membership exists.`,
          );
        }
      }
    },
    { timeout: 20_000 },
  );

  console.log('RBAC seed complete.');
} finally {
  await prisma.$disconnect();
}
