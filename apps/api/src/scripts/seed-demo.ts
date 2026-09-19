import { hash } from 'bcryptjs';
import { PrismaClient } from '@subscription-management/database';

if (process.env.DEMO_SEED_CONFIRM !== 'seed-demo-data')
  throw new Error('Set DEMO_SEED_CONFIRM=seed-demo-data to create demo records.');
const password = process.env.DEMO_ADMIN_PASSWORD;
if (!password || password.length < 12) throw new Error('DEMO_ADMIN_PASSWORD must contain at least 12 characters.');
const passwordHash = await hash(password, 12);

const prisma = new PrismaClient();
const permissions = [
  ['organization', 'read'], ['user', 'read'], ['user', 'create'], ['role', 'read'], ['role', 'manage'],
  ['customer', 'read'], ['customer', 'create'], ['customer', 'update'], ['product', 'read'], ['product', 'create'], ['product', 'update'],
  ['plan', 'read'], ['plan', 'create'], ['plan', 'update'], ['subscription', 'read'], ['subscription', 'create'], ['subscription', 'update'],
  ['invoice', 'read'], ['invoice', 'create'], ['invoice', 'update'], ['payment', 'read'], ['payment', 'create'],
  ['tax', 'read'], ['tax', 'manage'], ['discount', 'read'], ['discount', 'manage'], ['quotation', 'read'], ['quotation', 'create'], ['quotation', 'update'],
] as const;

try {
  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.upsert({ where: { slug: 'revops-demo' }, update: { status: 'ACTIVE' }, create: { name: 'RevOps Demo Workspace', slug: 'revops-demo', timezone: 'Asia/Kolkata', defaultCurrencyCode: 'INR' } });
    const user = await tx.user.upsert({ where: { email: 'demo.admin@revops.test' }, update: { passwordHash, status: 'ACTIVE' }, create: { email: 'demo.admin@revops.test', passwordHash, firstName: 'Demo', lastName: 'Admin', status: 'ACTIVE' } });
    const membership = await tx.organizationMembership.upsert({ where: { organizationId_userId: { organizationId: organization.id, userId: user.id } }, update: { status: 'ACTIVE' }, create: { organizationId: organization.id, userId: user.id, status: 'ACTIVE' } });
    await tx.permission.createMany({ data: permissions.map(([resource, action]) => ({ resource, action, code: `${resource}.${action}` })), skipDuplicates: true });
    const storedPermissions = await tx.permission.findMany({ where: { code: { in: permissions.map(([resource, action]) => `${resource}.${action}`) } } });
    const permissionId = new Map(storedPermissions.map((permission) => [permission.code, permission.id]));
    const admin = await tx.role.upsert({ where: { organizationId_code: { organizationId: organization.id, code: 'ADMIN' } }, update: { name: 'Admin', isSystem: true }, create: { organizationId: organization.id, name: 'Admin', code: 'ADMIN', description: 'Full demo access.', isSystem: true } });
    await tx.rolePermission.createMany({ data: storedPermissions.map((permission) => ({ roleId: admin.id, permissionId: permission.id })), skipDuplicates: true });
    await tx.membershipRole.upsert({ where: { membershipId_roleId: { membershipId: membership.id, roleId: admin.id } }, update: {}, create: { organizationId: organization.id, membershipId: membership.id, roleId: admin.id } });
    const roleFor = async (code: string, name: string, codes: string[]) => {
      const role = await tx.role.upsert({ where: { organizationId_code: { organizationId: organization.id, code } }, update: { name }, create: { organizationId: organization.id, code, name, isSystem: true } });
      await tx.rolePermission.createMany({ data: codes.map((code) => ({ roleId: role.id, permissionId: permissionId.get(code)! })), skipDuplicates: true });
      return role;
    };
    const billing = await roleFor('BILLING_MANAGER', 'Billing Manager', ['organization.read', 'customer.read', 'customer.create', 'customer.update', 'product.read', 'plan.read', 'subscription.read', 'subscription.create', 'subscription.update', 'quotation.read', 'quotation.create', 'quotation.update', 'invoice.read', 'invoice.create', 'invoice.update', 'payment.read', 'payment.create', 'tax.read', 'discount.read']);
    const viewer = await roleFor('READ_ONLY', 'Read-only', permissions.filter(([, action]) => action === 'read').map(([resource, action]) => `${resource}.${action}`));
    for (const [email, firstName, lastName, role] of [['billing.manager@revops.test', 'Billing', 'Manager', billing], ['viewer@revops.test', 'Read', 'Only', viewer]] as const) {
      const memberUser = await tx.user.upsert({ where: { email }, update: { passwordHash, status: 'ACTIVE' }, create: { email, passwordHash, firstName, lastName, status: 'ACTIVE' } });
      const member = await tx.organizationMembership.upsert({ where: { organizationId_userId: { organizationId: organization.id, userId: memberUser.id } }, update: { status: 'ACTIVE' }, create: { organizationId: organization.id, userId: memberUser.id, status: 'ACTIVE' } });
      await tx.membershipRole.upsert({ where: { membershipId_roleId: { membershipId: member.id, roleId: role.id } }, update: {}, create: { organizationId: organization.id, membershipId: member.id, roleId: role.id } });
    }

    await tx.tax.upsert({ where: { organizationId_name: { organizationId: organization.id, name: 'GST 18%' } }, update: { status: 'ACTIVE', rate: '18' }, create: { organizationId: organization.id, name: 'GST 18%', rate: '18' } });
    await tx.discount.upsert({ where: { organizationId_name: { organizationId: organization.id, name: 'Launch discount' } }, update: { status: 'ACTIVE', rate: '10' }, create: { organizationId: organization.id, name: 'Launch discount', rate: '10' } });
    const customer = await tx.customer.upsert({ where: { organizationId_customerNumber: { organizationId: organization.id, customerNumber: 'CUS-000001' } }, update: { status: 'ACTIVE' }, create: { organizationId: organization.id, customerNumber: 'CUS-000001', customerType: 'BUSINESS', legalName: 'Northstar Analytics Private Limited', displayName: 'Northstar Analytics', email: 'billing@northstar.demo', phone: '+91 98765 43210', defaultCurrencyCode: 'INR', status: 'ACTIVE' } });
    if (!await tx.customerContact.findFirst({ where: { customerId: customer.id } })) await tx.customerContact.create({ data: { customerId: customer.id, firstName: 'Priya', lastName: 'Shah', email: 'priya@northstar.demo', jobTitle: 'Finance Manager', isPrimary: true } });
    if (!await tx.customerAddress.findFirst({ where: { customerId: customer.id } })) await tx.customerAddress.create({ data: { customerId: customer.id, addressType: 'BILLING', addressLine1: '42 Market Street', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', countryCode: 'IN', isDefault: true } });
    const product = await tx.product.upsert({ where: { organizationId_productCode: { organizationId: organization.id, productCode: 'ANALYTICS-PRO' } }, update: { status: 'ACTIVE' }, create: { organizationId: organization.id, productCode: 'ANALYTICS-PRO', name: 'Analytics Pro', productType: 'SERVICE', costPrice: '2500', costCurrencyCode: 'INR', status: 'ACTIVE' } });
    const plan = await tx.plan.upsert({ where: { organizationId_planCode: { organizationId: organization.id, planCode: 'ANALYTICS-PRO-M' } }, update: { status: 'ACTIVE' }, create: { organizationId: organization.id, planCode: 'ANALYTICS-PRO-M', name: 'Analytics Pro Monthly', status: 'ACTIVE' } });
    if (!await tx.planItem.findFirst({ where: { organizationId: organization.id, planId: plan.id, productId: product.id } })) await tx.planItem.create({ data: { organizationId: organization.id, planId: plan.id, productId: product.id, quantity: 1 } });
    if (!await tx.planPrice.findFirst({ where: { organizationId: organization.id, planId: plan.id, currencyCode: 'INR', billingPeriod: 'MONTHLY', effectiveFrom: new Date('2025-01-01') } })) await tx.planPrice.create({ data: { organizationId: organization.id, planId: plan.id, currencyCode: 'INR', billingPeriod: 'MONTHLY', amount: '12000', effectiveFrom: new Date('2025-01-01') } });
    if (!await tx.subscription.findFirst({ where: { organizationId: organization.id, subscriptionNumber: 'SUB-000001' } })) await tx.subscription.create({ data: { organizationId: organization.id, subscriptionNumber: 'SUB-000001', customerId: customer.id, planId: plan.id, status: 'ACTIVE', startDate: new Date('2025-01-01'), billingStartDate: new Date('2025-01-01'), currencyCode: 'INR', items: { create: { descriptionSnapshot: 'Analytics Pro Monthly', quantity: 1, unitPrice: '12000', currencyCode: 'INR' } } } });
    const quote = await tx.quotation.upsert({ where: { organizationId_quotationNumber: { organizationId: organization.id, quotationNumber: 'QTE-000001' } }, update: {}, create: { organizationId: organization.id, quotationNumber: 'QTE-000001', customerId: customer.id, status: 'DRAFT', currencyCode: 'INR', validUntil: new Date('2027-12-31'), subtotal: '12000', grandTotal: '12000' } });
    if (!await tx.quotationItem.findFirst({ where: { quotationId: quote.id } })) await tx.quotationItem.create({ data: { quotationId: quote.id, description: 'Analytics Pro Monthly', quantity: 1, unitPrice: '12000', lineTotal: '12000' } });
    const draft = await tx.invoice.upsert({ where: { organizationId_invoiceNumber: { organizationId: organization.id, invoiceNumber: 'INV-000001' } }, update: {}, create: { organizationId: organization.id, invoiceNumber: 'INV-000001', customerId: customer.id, currencyCode: 'INR', issueDate: new Date('2026-09-01'), dueDate: new Date('2026-09-30') } });
    if (!await tx.invoiceItem.findFirst({ where: { invoiceId: draft.id } })) await tx.invoiceItem.create({ data: { invoiceId: draft.id, description: 'Analytics Pro Monthly', quantity: 1, unitPrice: '12000', lineSubtotal: '12000', discountAmount: '1200', taxAmount: '1944', lineTotal: '12744', currencyCode: 'INR' } });
    const finalized = await tx.invoice.upsert({ where: { organizationId_invoiceNumber: { organizationId: organization.id, invoiceNumber: 'INV-000002' } }, update: {}, create: { organizationId: organization.id, invoiceNumber: 'INV-000002', customerId: customer.id, status: 'FINALIZED', currencyCode: 'INR', issueDate: new Date('2026-08-01'), dueDate: new Date('2026-08-31'), subtotal: '12000', discountTotal: '1200', taxTotal: '1944', grandTotal: '12744', finalizedAt: new Date('2026-08-01') } });
    if (!await tx.invoiceItem.findFirst({ where: { invoiceId: finalized.id } })) await tx.invoiceItem.create({ data: { invoiceId: finalized.id, description: 'Analytics Pro Monthly', quantity: 1, unitPrice: '12000', lineSubtotal: '12000', discountAmount: '1200', taxAmount: '1944', lineTotal: '12744', currencyCode: 'INR' } });
    const payment = await tx.payment.upsert({ where: { organizationId_paymentNumber: { organizationId: organization.id, paymentNumber: 'PAY-000001' } }, update: {}, create: { organizationId: organization.id, paymentNumber: 'PAY-000001', invoiceId: finalized.id, amount: '8000', currencyCode: 'INR', method: 'BANK_TRANSFER', reference: 'DEMO-TRANSFER-001', idempotencyKey: 'demo-payment-000001' } });
    await tx.refund.upsert({ where: { organizationId_refundNumber: { organizationId: organization.id, refundNumber: 'REF-000001' } }, update: {}, create: { organizationId: organization.id, refundNumber: 'REF-000001', invoiceId: finalized.id, paymentId: payment.id, amount: '1000', currencyCode: 'INR', reason: 'Demo partial refund', idempotencyKey: 'demo-refund-000001' } });
    await Promise.all(['CUSTOMER', 'SUBSCRIPTION', 'QUOTATION', 'INVOICE', 'PAYMENT', 'REFUND'].map((sequenceType) => tx.organizationSequence.upsert({ where: { organizationId_sequenceType: { organizationId: organization.id, sequenceType: sequenceType as never } }, update: { nextValue: 10 }, create: { organizationId: organization.id, sequenceType: sequenceType as never, nextValue: 10 } })));
    console.log(`Demo workspace ready: ${organization.slug}`);
  }, { timeout: 30_000 });
} finally {
  await prisma.$disconnect();
}
