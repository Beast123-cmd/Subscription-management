CREATE TYPE "RuleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TABLE "taxes" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "organization_id" UUID NOT NULL, "name" VARCHAR(160) NOT NULL, "rate" DECIMAL(9,4) NOT NULL, "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL, CONSTRAINT "taxes_pkey" PRIMARY KEY ("id"));
CREATE TABLE "discounts" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "organization_id" UUID NOT NULL, "name" VARCHAR(160) NOT NULL, "rate" DECIMAL(9,4) NOT NULL, "status" "RuleStatus" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(6) NOT NULL, CONSTRAINT "discounts_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "taxes_organization_id_name_key" ON "taxes"("organization_id", "name");
CREATE UNIQUE INDEX "discounts_organization_id_name_key" ON "discounts"("organization_id", "name");
CREATE INDEX "taxes_organization_id_status_idx" ON "taxes"("organization_id", "status");
CREATE INDEX "discounts_organization_id_status_idx" ON "discounts"("organization_id", "status");
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
