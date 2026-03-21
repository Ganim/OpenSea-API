-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('A1', 'A3', 'CLOUD_NEOID', 'CLOUD_BIRDID', 'CLOUD_OTHER');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'PENDING_ACTIVATION');

-- CreateEnum
CREATE TYPE "SignatureLevel" AS ENUM ('SIMPLE', 'ADVANCED', 'QUALIFIED');

-- CreateEnum
CREATE TYPE "EnvelopeStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EnvelopeRoutingType" AS ENUM ('SEQUENTIAL', 'PARALLEL', 'HYBRID');

-- CreateEnum
CREATE TYPE "SignerRole" AS ENUM ('SIGNER', 'APPROVER', 'WITNESS', 'REVIEWER');

-- CreateEnum
CREATE TYPE "SignerStatus" AS ENUM ('PENDING', 'NOTIFIED', 'VIEWED', 'SIGNED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SignatureAuditType" AS ENUM ('CREATED', 'SENT', 'VIEWED', 'SIGNED', 'REJECTED', 'REMINDED', 'EXPIRED', 'CANCELLED', 'DOWNLOADED', 'DOCUMENT_VERIFIED', 'CERTIFICATE_VALIDATED', 'OTP_SENT', 'OTP_VERIFIED', 'LINK_ACCESSED');

-- CreateTable
CREATE TABLE "digital_certificates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "CertificateType" NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "subject_name" TEXT,
    "subject_cnpj" TEXT,
    "subject_cpf" TEXT,
    "issuer_name" TEXT,
    "serial_number" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "thumbprint" TEXT,
    "pfx_file_id" TEXT,
    "pfx_password" TEXT,
    "cloud_provider_id" TEXT,
    "alert_days_before" INTEGER NOT NULL DEFAULT 30,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "allowed_modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_envelopes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "status" "EnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
    "signature_level" "SignatureLevel" NOT NULL,
    "min_signature_level" "SignatureLevel",
    "document_file_id" TEXT NOT NULL,
    "document_hash" VARCHAR(64) NOT NULL,
    "signed_file_id" TEXT,
    "document_type" VARCHAR(16) NOT NULL DEFAULT 'PDF',
    "source_module" VARCHAR(32) NOT NULL,
    "source_entity_type" VARCHAR(64) NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "routing_type" "EnvelopeRoutingType" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "reminder_days" INTEGER NOT NULL DEFAULT 3,
    "auto_expire_days" INTEGER,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_envelope_signers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "group" INTEGER NOT NULL DEFAULT 1,
    "role" "SignerRole" NOT NULL DEFAULT 'SIGNER',
    "status" "SignerStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" TEXT,
    "contact_id" TEXT,
    "external_name" TEXT,
    "external_email" TEXT,
    "external_phone" TEXT,
    "external_document" TEXT,
    "signature_level" "SignatureLevel" NOT NULL,
    "certificate_id" TEXT,
    "access_token" VARCHAR(128),
    "access_token_expires_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "signature_image_file_id" TEXT,
    "signature_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "geo_latitude" DECIMAL(8,6),
    "geo_longitude" DECIMAL(8,6),
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "rejected_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "last_notified_at" TIMESTAMP(3),
    "notification_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_envelope_signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_audit_events" (
    "id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "SignatureAuditType" NOT NULL,
    "signer_id" TEXT,
    "description" VARCHAR(512) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "geo_latitude" DECIMAL(8,6),
    "geo_longitude" DECIMAL(8,6),
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "signature_level" "SignatureLevel" NOT NULL,
    "routing_type" "EnvelopeRoutingType" NOT NULL,
    "signer_slots" JSONB NOT NULL,
    "expiration_days" INTEGER,
    "reminder_days" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "digital_certificates_tenant_id_idx" ON "digital_certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "digital_certificates_tenant_id_status_idx" ON "digital_certificates"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "digital_certificates_tenant_id_valid_until_idx" ON "digital_certificates"("tenant_id", "valid_until");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_idx" ON "signature_envelopes"("tenant_id");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_status_idx" ON "signature_envelopes"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_source_module_source_entity_i_idx" ON "signature_envelopes"("tenant_id", "source_module", "source_entity_id");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_created_by_user_id_idx" ON "signature_envelopes"("tenant_id", "created_by_user_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_envelope_id_idx" ON "signature_envelope_signers"("envelope_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_tenant_id_idx" ON "signature_envelope_signers"("tenant_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_envelope_id_order_group_idx" ON "signature_envelope_signers"("envelope_id", "order", "group");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_access_token_idx" ON "signature_envelope_signers"("access_token");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_user_id_idx" ON "signature_envelope_signers"("user_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_tenant_id_status_idx" ON "signature_envelope_signers"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "signature_audit_events_envelope_id_idx" ON "signature_audit_events"("envelope_id");

-- CreateIndex
CREATE INDEX "signature_audit_events_tenant_id_idx" ON "signature_audit_events"("tenant_id");

-- CreateIndex
CREATE INDEX "signature_audit_events_envelope_id_timestamp_idx" ON "signature_audit_events"("envelope_id", "timestamp");

-- CreateIndex
CREATE INDEX "signature_templates_tenant_id_idx" ON "signature_templates"("tenant_id");

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_pfx_file_id_fkey" FOREIGN KEY ("pfx_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "storage_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_signed_file_id_fkey" FOREIGN KEY ("signed_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "digital_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_signature_image_file_id_fkey" FOREIGN KEY ("signature_image_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_audit_events" ADD CONSTRAINT "signature_audit_events_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_templates" ADD CONSTRAINT "signature_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
