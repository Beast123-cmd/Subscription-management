-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('BUSINESS', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CustomerContactStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING', 'OTHER');

-- CreateEnum
CREATE TYPE "OrganizationSequenceType" AS ENUM ('CUSTOMER');

-- CreateTable
CREATE TABLE "organization_sequences" (
    "organization_id" UUID NOT NULL,
    "sequence_type" "OrganizationSequenceType" NOT NULL,
    "next_value" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "organization_sequences_pkey" PRIMARY KEY ("organization_id", "sequence_type")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "customer_number" VARCHAR(64) NOT NULL,
    "customer_type" "CustomerType" NOT NULL,
    "legal_name" VARCHAR(160) NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(40),
    "tax_identifier" VARCHAR(100),
    "default_currency_code" CHAR(3) NOT NULL,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(40),
    "job_title" VARCHAR(100),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "CustomerContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "address_type" "AddressType" NOT NULL,
    "address_line_1" VARCHAR(160) NOT NULL,
    "address_line_2" VARCHAR(160),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100),
    "postal_code" VARCHAR(32),
    "country_code" CHAR(2) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_organization_id_customer_number_key" ON "customers"("organization_id", "customer_number");
CREATE UNIQUE INDEX "customers_organization_id_id_key" ON "customers"("organization_id", "id");
CREATE INDEX "customers_organization_id_status_created_at_idx" ON "customers"("organization_id", "status", "created_at");
CREATE INDEX "customer_contacts_customer_id_status_idx" ON "customer_contacts"("customer_id", "status");
CREATE INDEX "customer_addresses_customer_id_address_type_idx" ON "customer_addresses"("customer_id", "address_type");

-- Keep a single primary contact and one default address per address type.
CREATE UNIQUE INDEX "customer_contacts_one_primary_per_customer" ON "customer_contacts"("customer_id") WHERE "is_primary";
CREATE UNIQUE INDEX "customer_addresses_one_default_per_type" ON "customer_addresses"("customer_id", "address_type") WHERE "is_default";

-- AddForeignKey
ALTER TABLE "organization_sequences" ADD CONSTRAINT "organization_sequences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
