ALTER TABLE "subscriptions" ADD COLUMN "source_quotation_id" UUID;
CREATE UNIQUE INDEX "subscriptions_source_quotation_id_key" ON "subscriptions"("source_quotation_id");
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_source_quotation_id_fkey" FOREIGN KEY ("source_quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
