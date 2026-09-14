ALTER TABLE "payments" ADD COLUMN "idempotency_key" VARCHAR(128);
ALTER TABLE "refunds" ADD COLUMN "idempotency_key" VARCHAR(128);
UPDATE "payments" SET "idempotency_key" = "id"::text WHERE "idempotency_key" IS NULL;
UPDATE "refunds" SET "idempotency_key" = "id"::text WHERE "idempotency_key" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "idempotency_key" SET NOT NULL;
ALTER TABLE "refunds" ALTER COLUMN "idempotency_key" SET NOT NULL;
CREATE UNIQUE INDEX "payments_organization_id_idempotency_key_key" ON "payments"("organization_id", "idempotency_key");
CREATE UNIQUE INDEX "refunds_organization_id_idempotency_key_key" ON "refunds"("organization_id", "idempotency_key");
