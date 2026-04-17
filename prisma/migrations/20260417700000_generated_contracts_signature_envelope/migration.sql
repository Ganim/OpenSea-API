-- AlterTable (idempotent to handle environments where the base table was
-- synced via `prisma db push` rather than migrations)
ALTER TABLE "hr_generated_employment_contracts" ADD COLUMN IF NOT EXISTS "signature_envelope_id" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "hr_generated_employment_contracts_signature_envelope_id_idx" ON "hr_generated_employment_contracts"("signature_envelope_id");
