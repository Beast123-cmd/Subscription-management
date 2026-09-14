CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'VOIDED');
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD', 'UPI', 'CASH', 'OTHER');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'VOIDED');
ALTER TYPE "OrganizationSequenceType" ADD VALUE 'PAYMENT';
ALTER TYPE "OrganizationSequenceType" ADD VALUE 'REFUND';

CREATE TABLE "payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organization_id" UUID NOT NULL,
  "payment_number" VARCHAR(64) NOT NULL, "invoice_id" UUID NOT NULL,
  "amount" DECIMAL(19,4) NOT NULL, "currency_code" CHAR(3) NOT NULL,
  "method" "PaymentMethod" NOT NULL, "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCEEDED',
  "reference" VARCHAR(255), "notes" VARCHAR(2000), "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "refunds" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organization_id" UUID NOT NULL,
  "refund_number" VARCHAR(64) NOT NULL, "invoice_id" UUID NOT NULL, "payment_id" UUID NOT NULL,
  "amount" DECIMAL(19,4) NOT NULL, "currency_code" CHAR(3) NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'SUCCEEDED', "reason" VARCHAR(500),
  "refunded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_organization_id_payment_number_key" ON "payments"("organization_id", "payment_number");
CREATE UNIQUE INDEX "refunds_organization_id_refund_number_key" ON "refunds"("organization_id", "refund_number");
CREATE INDEX "payments_organization_id_invoice_id_status_received_at_idx" ON "payments"("organization_id", "invoice_id", "status", "received_at");
CREATE INDEX "refunds_organization_id_invoice_id_status_refunded_at_idx" ON "refunds"("organization_id", "invoice_id", "status", "refunded_at");
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
