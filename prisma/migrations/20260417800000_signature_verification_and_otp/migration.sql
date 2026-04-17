-- SignatureEnvelope: verification code (human-legible ID for envelope tracking)
ALTER TABLE "signature_envelopes" ADD COLUMN "verification_code" VARCHAR(16);
CREATE UNIQUE INDEX "signature_envelopes_tenant_verification_code_key" ON "signature_envelopes"("tenant_id", "verification_code");

-- SignatureEnvelopeSigner: OTP fields (prep for Lei 14.063 ADVANCED level signatures)
ALTER TABLE "signature_envelope_signers" ADD COLUMN "otp_code_hash" VARCHAR(128);
ALTER TABLE "signature_envelope_signers" ADD COLUMN "otp_expires_at" TIMESTAMP(3);
ALTER TABLE "signature_envelope_signers" ADD COLUMN "otp_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "signature_envelope_signers" ADD COLUMN "otp_sent_at" TIMESTAMP(3);
