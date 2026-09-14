CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');
CREATE TYPE "PlanPriceStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "plans" (
 "id" UUID NOT NULL, "organization_id" UUID NOT NULL, "plan_code" VARCHAR(64) NOT NULL, "name" VARCHAR(160) NOT NULL, "description" VARCHAR(2000), "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE', "minimum_quantity" INTEGER NOT NULL DEFAULT 1, "maximum_quantity" INTEGER, "starts_at" DATE, "ends_at" DATE, "auto_close" BOOLEAN NOT NULL DEFAULT false, "closable" BOOLEAN NOT NULL DEFAULT true, "pausable" BOOLEAN NOT NULL DEFAULT true, "renewable" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
 CONSTRAINT "plans_pkey" PRIMARY KEY ("id"), CONSTRAINT "plans_quantity_check" CHECK ("minimum_quantity" > 0 AND ("maximum_quantity" IS NULL OR "maximum_quantity" >= "minimum_quantity")), CONSTRAINT "plans_dates_check" CHECK ("ends_at" IS NULL OR "starts_at" IS NULL OR "ends_at" > "starts_at")
);
CREATE TABLE "plan_items" (
 "id" UUID NOT NULL, "organization_id" UUID NOT NULL, "plan_id" UUID NOT NULL, "product_id" UUID NOT NULL, "variant_id" UUID, "quantity" INTEGER NOT NULL, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
 CONSTRAINT "plan_items_pkey" PRIMARY KEY ("id"), CONSTRAINT "plan_items_quantity_check" CHECK ("quantity" > 0)
);
CREATE TABLE "plan_prices" (
 "id" UUID NOT NULL, "organization_id" UUID NOT NULL, "plan_id" UUID NOT NULL, "currency_code" CHAR(3) NOT NULL, "billing_period" "BillingPeriod" NOT NULL, "amount" DECIMAL(19,4) NOT NULL, "effective_from" DATE NOT NULL, "effective_until" DATE, "status" "PlanPriceStatus" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL,
 CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id"), CONSTRAINT "plan_prices_amount_check" CHECK ("amount" >= 0), CONSTRAINT "plan_prices_dates_check" CHECK ("effective_until" IS NULL OR "effective_until" > "effective_from")
);
CREATE UNIQUE INDEX "plans_organization_id_plan_code_key" ON "plans"("organization_id", "plan_code");
CREATE UNIQUE INDEX "plans_organization_id_id_key" ON "plans"("organization_id", "id");
CREATE INDEX "plans_organization_id_status_created_at_idx" ON "plans"("organization_id", "status", "created_at");
CREATE INDEX "plan_items_organization_id_plan_id_idx" ON "plan_items"("organization_id", "plan_id");
CREATE INDEX "plan_prices_organization_id_plan_id_currency_code_billing_period_effective_from_idx" ON "plan_prices"("organization_id", "plan_id", "currency_code", "billing_period", "effective_from");
ALTER TABLE "plans" ADD CONSTRAINT "plans_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_organization_id_plan_id_fkey" FOREIGN KEY ("organization_id", "plan_id") REFERENCES "plans"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_organization_id_product_id_fkey" FOREIGN KEY ("organization_id", "product_id") REFERENCES "products"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_organization_id_variant_id_fkey" FOREIGN KEY ("organization_id", "variant_id") REFERENCES "product_variants"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_organization_id_plan_id_fkey" FOREIGN KEY ("organization_id", "plan_id") REFERENCES "plans"("organization_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_no_active_overlap" EXCLUDE USING gist ("plan_id" WITH =, "currency_code" WITH =, "billing_period" WITH =, daterange("effective_from", "effective_until", '[)') WITH &&) WHERE ("status" = 'ACTIVE');
