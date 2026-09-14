import { hash } from 'bcryptjs';
import { PrismaClient } from '@subscription-management/database';

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const email = required('BOOTSTRAP_ADMIN_EMAIL').toLowerCase();
const slug = required('BOOTSTRAP_ORGANIZATION_SLUG').toLowerCase();
const timezone = process.env.BOOTSTRAP_ORGANIZATION_TIMEZONE?.trim() || 'Asia/Kolkata';

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error('BOOTSTRAP_ORGANIZATION_SLUG must be lowercase and URL-safe.');
}
try {
  Intl.DateTimeFormat(undefined, { timeZone: timezone });
} catch {
  throw new Error('BOOTSTRAP_ORGANIZATION_TIMEZONE must be a valid IANA timezone.');
}

const prisma = new PrismaClient();

try {
  const result = await prisma.$transaction(async (tx) => {
    const existingOrganization = await tx.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingOrganization) throw new Error('An organization with this slug already exists.');

    const existingUser = await tx.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) throw new Error('A user with this email already exists.');

    const organization = await tx.organization.create({
      data: {
        name: required('BOOTSTRAP_ORGANIZATION_NAME'),
        slug,
        timezone,
        defaultCurrencyCode: process.env.BOOTSTRAP_DEFAULT_CURRENCY?.trim().toUpperCase() || 'INR',
      },
    });
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await hash(required('BOOTSTRAP_ADMIN_PASSWORD'), 12),
        firstName: required('BOOTSTRAP_ADMIN_FIRST_NAME'),
        lastName: required('BOOTSTRAP_ADMIN_LAST_NAME'),
        status: 'ACTIVE',
      },
    });
    await tx.organizationMembership.create({
      data: { organizationId: organization.id, userId: user.id },
    });
    return { organizationId: organization.id, userId: user.id };
  });

  console.log(`Bootstrap complete: organization=${result.organizationId} user=${result.userId}`);
} finally {
  await prisma.$disconnect();
}
