CREATE INDEX "payments_organization_id_received_at_idx" ON "payments"("organization_id", "received_at");
CREATE INDEX "refunds_organization_id_payment_id_status_idx" ON "refunds"("organization_id", "payment_id", "status");
CREATE INDEX "refunds_organization_id_refunded_at_idx" ON "refunds"("organization_id", "refunded_at");
