-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "AccountClass" AS ENUM ('CURRENT', 'NON_CURRENT', 'OPERATIONAL', 'FINANCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "IndexationType" AS ENUM ('NONE', 'IPCA', 'IGPM', 'FIXED_RATE');

-- CreateEnum
CREATE TYPE "JournalSourceType" AS ENUM ('FINANCE_ENTRY', 'FINANCE_PAYMENT', 'MANUAL');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "EntryLineType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "BidModality" AS ENUM ('PREGAO_ELETRONICO', 'PREGAO_PRESENCIAL', 'CONCORRENCIA', 'TOMADA_PRECOS', 'CONVITE', 'LEILAO', 'DIALOGO_COMPETITIVO', 'CONCURSO', 'DISPENSA', 'INEXIGIBILIDADE');

-- CreateEnum
CREATE TYPE "BidCriterion" AS ENUM ('MENOR_PRECO', 'MAIOR_DESCONTO', 'MELHOR_TECNICA', 'TECNICA_PRECO', 'MAIOR_LANCE', 'MAIOR_RETORNO');

-- CreateEnum
CREATE TYPE "BidLegalFramework" AS ENUM ('LEI_14133_2021', 'LEI_8666_1993', 'LEI_10520_2002', 'LEI_12462_2011', 'DECRETO_10024_2019');

-- CreateEnum
CREATE TYPE "BidExecutionRegime" AS ENUM ('EMPREITADA_PRECO_GLOBAL', 'EMPREITADA_PRECO_UNITARIO', 'TAREFA', 'INTEGRAL', 'FORNECIMENTO_REGIME_PRECO');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('DISCOVERED', 'ANALYZING', 'VIABLE', 'NOT_VIABLE', 'PREPARING', 'PROPOSAL_SENT', 'AWAITING_DISPUTE', 'IN_DISPUTE', 'WON', 'LOST', 'DESERTED', 'REVOKED', 'SUSPENDED', 'MONITORING', 'CONTRACTED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BidItemStatus" AS ENUM ('PENDING_BID_ITEM', 'QUOTED', 'WON_BID_ITEM', 'LOST_BID_ITEM', 'DESERTED_BID_ITEM', 'CANCELLED_BID_ITEM');

-- CreateEnum
CREATE TYPE "BidProposalStatus" AS ENUM ('DRAFT_PROPOSAL', 'REVIEW_PROPOSAL', 'APPROVED_PROPOSAL', 'SENT_PROPOSAL', 'ACCEPTED_PROPOSAL', 'REJECTED_PROPOSAL', 'SUPERSEDED_PROPOSAL');

-- CreateEnum
CREATE TYPE "BidDocumentType" AS ENUM ('CERTIDAO_FEDERAL', 'CERTIDAO_ESTADUAL', 'CERTIDAO_MUNICIPAL', 'CERTIDAO_TRABALHISTA', 'CERTIDAO_FGTS', 'CERTIDAO_FALENCIA', 'BALANCO_PATRIMONIAL', 'CONTRATO_SOCIAL', 'ALVARA', 'ATESTADO_CAPACIDADE', 'PROPOSTA_TECNICA', 'PROPOSTA_COMERCIAL', 'EDITAL', 'ATA_REGISTRO', 'OUTROS');

-- CreateEnum
CREATE TYPE "BidDocRenewalMethod" AS ENUM ('AUTOMATIC_API', 'AUTOMATIC_SCRAPING', 'MANUAL');

-- CreateEnum
CREATE TYPE "BidDocRenewalStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING_RENEWAL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "BidContractStatus" AS ENUM ('DRAFT_CONTRACT', 'ACTIVE_CONTRACT', 'SUSPENDED_CONTRACT', 'COMPLETED_CONTRACT', 'TERMINATED_CONTRACT', 'RENEWED_CONTRACT');

-- CreateEnum
CREATE TYPE "BidEmpenhoType" AS ENUM ('ORDINARIO', 'ESTIMATIVO', 'GLOBAL_EMPENHO');

-- CreateEnum
CREATE TYPE "BidEmpenhoStatus" AS ENUM ('EMITIDO', 'PARCIALMENTE_LIQUIDADO', 'LIQUIDADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "BidMonitorEventType" AS ENUM ('STATUS_CHANGE', 'CONVOCATION', 'DISQUALIFICATION', 'APPEAL', 'IMPUGNATION', 'DEADLINE_APPROACHING', 'DOCUMENT_EXPIRING', 'PRICE_REGISTRATION_CALL', 'CONTRACT_RENEWAL', 'ADDENDUM', 'AI_SUGGESTION', 'PORTAL_UPDATE');

-- CreateEnum
CREATE TYPE "BidHistoryAction" AS ENUM ('BID_CREATED', 'BID_UPDATED', 'BID_STATUS_CHANGED', 'BID_PROPOSAL_CREATED', 'BID_PROPOSAL_SENT', 'BID_DOCUMENT_UPLOADED', 'BID_DISPUTE_ENTERED', 'BID_PLACED', 'BID_WON', 'BID_LOST', 'BID_CONTRACT_CREATED', 'BID_EMPENHO_RECEIVED', 'BID_ORDER_CREATED', 'BID_AI_ANALYSIS', 'BID_AI_DECISION', 'BID_MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "BidQuotaType" AS ENUM ('PRINCIPAL', 'COTA_RESERVADA', 'EXCLUSIVO_ME_EPP');

-- CreateEnum
CREATE TYPE "MarketplaceType" AS ENUM ('MERCADO_LIVRE', 'SHOPEE', 'AMAZON', 'MAGALU', 'TIKTOK_SHOP', 'AMERICANAS', 'ALIEXPRESS', 'CASAS_BAHIA', 'SHEIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MarketplaceConnectionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "MarketplaceFulfillmentType" AS ENUM ('SELF', 'MARKETPLACE', 'HYBRID');

-- CreateEnum
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'ERROR', 'OUT_OF_STOCK', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "MarketplaceOrderStatus" AS ENUM ('RECEIVED', 'ACKNOWLEDGED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'DISPUTE');

-- CreateEnum
CREATE TYPE "MarketplacePaymentType" AS ENUM ('SALE', 'REFUND', 'COMMISSION', 'SHIPPING_FEE', 'AD_CHARGE', 'FULFILLMENT_FEE', 'ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "MarketplacePaymentStatus" AS ENUM ('PENDING', 'SETTLED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessagingChannel" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "MessagingDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessagingMessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "MessagingMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION', 'TEMPLATE', 'INTERACTIVE', 'STICKER');

-- CreateEnum
CREATE TYPE "MessagingAccountStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'ERROR', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MessagingTemplateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessagingTemplateCategory" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');

-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NFE', 'NFCE', 'NFSE');

-- CreateEnum
CREATE TYPE "FiscalDocumentStatus" AS ENUM ('DRAFT', 'PENDING', 'AUTHORIZED', 'CANCELLED', 'DENIED', 'CORRECTED', 'INUTILIZED');

-- CreateEnum
CREATE TYPE "FiscalEmissionType" AS ENUM ('NORMAL', 'CONTINGENCY_SVC_AN', 'CONTINGENCY_SVC_RS', 'CONTINGENCY_EPEC', 'CONTINGENCY_OFFLINE');

-- CreateEnum
CREATE TYPE "FiscalEventType" AS ENUM ('AUTHORIZATION', 'CANCELLATION', 'CORRECTION_LETTER', 'INUTILIZATION', 'MANIFESTATION');

-- CreateEnum
CREATE TYPE "FiscalProviderType" AS ENUM ('NUVEM_FISCAL', 'FOCUS_NFE', 'WEBMANIABR', 'NFEWIZARD');

-- CreateEnum
CREATE TYPE "AiWorkflowTrigger" AS ENUM ('MANUAL', 'CRON', 'EVENT');

-- CreateEnum
CREATE TYPE "AiWorkflowExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EscalationChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'INTERNAL_NOTE', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "EscalationTemplateType" AS ENUM ('FRIENDLY_REMINDER', 'FORMAL_NOTICE', 'URGENT_NOTICE', 'FINAL_NOTICE');

-- CreateEnum
CREATE TYPE "EscalationActionStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EsocialEventStatus" AS ENUM ('DRAFT', 'REVIEWED', 'APPROVED', 'TRANSMITTING', 'ACCEPTED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "EsocialEnvironment" AS ENUM ('PRODUCAO', 'HOMOLOGACAO');

-- CreateEnum
CREATE TYPE "EsocialBatchStatus" AS ENUM ('PENDING', 'TRANSMITTING', 'TRANSMITTED', 'PARTIALLY_ACCEPTED', 'ACCEPTED', 'REJECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "FinanceApprovalAction" AS ENUM ('AUTO_PAY', 'AUTO_APPROVE', 'FLAG_REVIEW');

-- CreateEnum
CREATE TYPE "TaxObligationStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BankPaymentMethod" AS ENUM ('PIX', 'TED', 'BOLETO');

-- CreateEnum
CREATE TYPE "PaymentLinkStatus" AS ENUM ('ACTIVE', 'PAID', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobPostingStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FILLED');

-- CreateEnum
CREATE TYPE "JobPostingType" AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERN', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('WEBSITE', 'LINKEDIN', 'REFERRAL', 'AGENCY', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'ASSESSMENT', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "InterviewStageType" AS ENUM ('SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'CULTURE_FIT', 'FINAL');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "InterviewRecommendation" AS ENUM ('ADVANCE', 'HOLD', 'REJECT');

-- CreateEnum
CREATE TYPE "PaymentChargeStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('NFE', 'NFCE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'ISSUED', 'CANCELLED', 'ERROR');

-- CreateEnum
CREATE TYPE "PrinterType" AS ENUM ('THERMAL', 'INKJET', 'LABEL');

-- CreateEnum
CREATE TYPE "PrinterConnection" AS ENUM ('USB', 'NETWORK', 'BLUETOOTH', 'SERIAL');

-- CreateEnum
CREATE TYPE "PrintJobType" AS ENUM ('RECEIPT', 'LABEL', 'REPORT', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "PrintJobStatus" AS ENUM ('CREATED', 'QUEUED', 'PRINTING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AiActionStatus" ADD VALUE 'UNDONE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'INVOICED';
ALTER TYPE "OrderStatus" ADD VALUE 'INVOICE_CANCELLED';

-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationType_new" AS ENUM ('COMPANY', 'CUSTOMER');
ALTER TABLE "organizations" ALTER COLUMN "type" TYPE "OrganizationType_new" USING ("type"::text::"OrganizationType_new");
ALTER TYPE "OrganizationType" RENAME TO "OrganizationType_old";
ALTER TYPE "OrganizationType_new" RENAME TO "OrganizationType";
DROP TYPE "public"."OrganizationType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PayrollItemType" ADD VALUE 'OVERTIME_100';
ALTER TYPE "PayrollItemType" ADD VALUE 'DSR';

-- AlterEnum
BEGIN;
CREATE TYPE "PosTerminalMode_new" AS ENUM ('SALES_ONLY', 'SALES_WITH_CHECKOUT', 'CASHIER', 'TOTEM');
ALTER TABLE "pos_terminals" ALTER COLUMN "mode" TYPE "PosTerminalMode_new" USING ("mode"::text::"PosTerminalMode_new");
ALTER TYPE "PosTerminalMode" RENAME TO "PosTerminalMode_old";
ALTER TYPE "PosTerminalMode_new" RENAME TO "PosTerminalMode";
DROP TYPE "public"."PosTerminalMode_old";
COMMIT;

-- AlterEnum
ALTER TYPE "SystemModuleEnum" ADD VALUE 'MESSAGING';

-- DropForeignKey
ALTER TABLE "pos_terminals" DROP CONSTRAINT "pos_terminals_warehouse_id_fkey";

-- DropIndex
DROP INDEX "onboarding_checklists_employee_id_key";

-- DropIndex
DROP INDEX "pos_terminals_tenant_id_device_id_key";

-- AlterTable
ALTER TABLE "ai_action_logs" ADD COLUMN     "audit_log_id" TEXT;

-- AlterTable
ALTER TABLE "crm_pipelines" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "address_municipality_code" TEXT,
ADD COLUMN     "admission_type" TEXT,
ADD COLUMN     "cbo_code" TEXT,
ADD COLUMN     "child_birth_date" TIMESTAMP(3),
ADD COLUMN     "cnh_category" TEXT,
ADD COLUMN     "cnh_expiration" TIMESTAMP(3),
ADD COLUMN     "cnh_number" TEXT,
ADD COLUMN     "education_level" TEXT,
ADD COLUMN     "fgts_account_number" TEXT,
ADD COLUMN     "fgts_opt_date" TIMESTAMP(3),
ADD COLUMN     "is_pregnant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mother_name" TEXT,
ADD COLUMN     "municipality_code" TEXT,
ADD COLUMN     "pregnancy_start_date" TIMESTAMP(3),
ADD COLUMN     "professional_registration" TEXT,
ADD COLUMN     "race_color" TEXT,
ADD COLUMN     "salary_unit" TEXT DEFAULT 'MONTHLY',
ADD COLUMN     "union_code" TEXT,
ADD COLUMN     "worker_category" TEXT;

-- AlterTable
ALTER TABLE "finance_entry_payments" ADD COLUMN     "idempotency_key" VARCHAR(64);

-- AlterTable
ALTER TABLE "onboarding_checklists" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "title" VARCHAR(200) NOT NULL DEFAULT 'Onboarding';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cashier_user_id" TEXT,
ADD COLUMN     "claimed_at" TIMESTAMP(3),
ADD COLUMN     "claimed_by_user_id" TEXT,
ADD COLUMN     "invoice_id" TEXT,
ADD COLUMN     "invoiced_at" TIMESTAMP(3),
ADD COLUMN     "pos_session_id" TEXT,
ADD COLUMN     "sale_code" VARCHAR(8),
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "terminal_id" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "overtime" ADD COLUMN     "rejected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" TEXT,
ADD COLUMN     "rejection_reason" TEXT;

-- AlterTable
ALTER TABLE "pos_sessions" ADD COLUMN     "orphan_closed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pos_terminals" DROP COLUMN "cashier_mode",
DROP COLUMN "device_id",
DROP COLUMN "name",
DROP COLUMN "warehouse_id",
ADD COLUMN     "allow_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "pairing_window_expires_at" TIMESTAMP(3),
ADD COLUMN     "pairing_window_opened_at" TIMESTAMP(3),
ADD COLUMN     "requires_session" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "system_user_id" TEXT,
ADD COLUMN     "terminal_code" VARCHAR(8) NOT NULL,
ADD COLUMN     "terminal_name" VARCHAR(128) NOT NULL,
ADD COLUMN     "totem_code" VARCHAR(8);

-- AlterTable
ALTER TABLE "recurring_configs" ADD COLUMN     "adjustment_month" INTEGER,
ADD COLUMN     "fixed_adjustment_rate" DECIMAL(6,4),
ADD COLUMN     "indexation_type" "IndexationType",
ADD COLUMN     "last_adjustment_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "time_banks" ADD COLUMN     "agreement_type" VARCHAR(16) NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "expiration_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "device_fingerprint" TEXT,
ADD COLUMN     "device_type" VARCHAR(8),
ADD COLUMN     "nsr_number" INTEGER,
ADD COLUMN     "photo_url" TEXT,
ADD COLUMN     "receipt_generated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receipt_url" TEXT;

-- DropEnum
DROP TYPE "PosCashierMode";

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "code" VARCHAR(32),
    "type" VARCHAR(32) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "break_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_night_shift" BOOLEAN NOT NULL DEFAULT false,
    "color" VARCHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacation_splits" (
    "id" TEXT NOT NULL,
    "vacation_period_id" TEXT NOT NULL,
    "split_number" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'SCHEDULED',
    "payment_date" TIMESTAMP(3),
    "payment_amount" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacation_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_warnings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "issued_by" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "incident_date" TIMESTAMP(3) NOT NULL,
    "witness_name" VARCHAR(256),
    "employee_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "suspension_days" INTEGER,
    "attachment_url" VARCHAR(512),
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_dependants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "cpf" VARCHAR(256),
    "cpf_hash" VARCHAR(64),
    "birth_date" TIMESTAMP(3) NOT NULL,
    "relationship" VARCHAR(32) NOT NULL,
    "is_irrf_dependant" BOOLEAN NOT NULL DEFAULT false,
    "is_salario_familia" BOOLEAN NOT NULL DEFAULT false,
    "has_disability" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_dependants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terminations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "termination_date" TIMESTAMP(3) NOT NULL,
    "last_work_day" TIMESTAMP(3) NOT NULL,
    "notice_type" VARCHAR(16) NOT NULL,
    "notice_days" INTEGER NOT NULL DEFAULT 30,
    "saldo_salario" DECIMAL(12,2),
    "aviso_indenizado" DECIMAL(12,2),
    "decimo_terceiro_prop" DECIMAL(12,2),
    "ferias_vencidas" DECIMAL(12,2),
    "ferias_vencidas_terco" DECIMAL(12,2),
    "ferias_proporcional" DECIMAL(12,2),
    "ferias_proporcional_terco" DECIMAL(12,2),
    "multa_fgts" DECIMAL(12,2),
    "inss_rescisao" DECIMAL(12,2),
    "irrf_rescisao" DECIMAL(12,2),
    "outros_descontos" DECIMAL(12,2),
    "total_bruto" DECIMAL(12,2),
    "total_descontos" DECIMAL(12,2),
    "total_liquido" DECIMAL(12,2),
    "payment_deadline" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "status" VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_exams" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "expiration_date" TIMESTAMP(3),
    "doctor_name" VARCHAR(256) NOT NULL,
    "doctor_crm" VARCHAR(32) NOT NULL,
    "result" VARCHAR(32) NOT NULL,
    "observations" TEXT,
    "document_url" TEXT,
    "exam_category" VARCHAR(32),
    "validity_months" INTEGER,
    "clinic_name" VARCHAR(256),
    "clinic_address" VARCHAR(512),
    "physician_name" VARCHAR(256),
    "physician_crm" VARCHAR(32),
    "aptitude" VARCHAR(32),
    "restrictions" TEXT,
    "next_exam_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "occupational_exam_requirements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "position_id" TEXT,
    "exam_type" VARCHAR(64) NOT NULL,
    "exam_category" VARCHAR(32) NOT NULL,
    "frequency_months" INTEGER NOT NULL,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "occupational_exam_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "responsible_name" VARCHAR(256) NOT NULL,
    "responsible_registration" VARCHAR(64) NOT NULL,
    "document_url" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workplace_risks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "safety_program_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "category" VARCHAR(32) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "source" VARCHAR(256),
    "affected_area" VARCHAR(256),
    "control_measures" TEXT,
    "epi_required" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workplace_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cipa_mandates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "election_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cipa_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cipa_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mandate_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "is_stable" BOOLEAN NOT NULL DEFAULT false,
    "stable_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cipa_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(1000),
    "category" VARCHAR(32) NOT NULL,
    "format" VARCHAR(16) NOT NULL,
    "duration_hours" INTEGER NOT NULL,
    "instructor" VARCHAR(128),
    "max_participants" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "validity_months" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "training_program_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'ENROLLED',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "certificate_url" VARCHAR(500),
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cycles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(1000),
    "type" VARCHAR(32) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "review_cycle_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "self_score" DOUBLE PRECISION,
    "manager_score" DOUBLE PRECISION,
    "final_score" DOUBLE PRECISION,
    "self_comments" VARCHAR(2000),
    "manager_comments" VARCHAR(2000),
    "strengths" VARCHAR(2000),
    "improvements" VARCHAR(2000),
    "goals" VARCHAR(2000),
    "employee_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" VARCHAR(2000),
    "type" VARCHAR(32) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "options" JSONB,
    "order" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "category" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_answers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_response_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "rating_value" INTEGER,
    "text_value" VARCHAR(2000),
    "selected_options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objectives" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" VARCHAR(2000),
    "owner_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "level" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    "period" VARCHAR(16) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" VARCHAR(2000),
    "type" VARCHAR(16) NOT NULL,
    "start_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_value" DOUBLE PRECISION NOT NULL,
    "current_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" VARCHAR(32),
    "status" VARCHAR(16) NOT NULL DEFAULT 'ON_TRACK',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "okr_check_ins" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key_result_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "previous_value" DOUBLE PRECISION NOT NULL,
    "new_value" DOUBLE PRECISION NOT NULL,
    "note" VARCHAR(2000),
    "confidence" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "okr_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "AccountType" NOT NULL,
    "class" "AccountClass" NOT NULL,
    "nature" "AccountNature" NOT NULL,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "date" DATE NOT NULL,
    "description" VARCHAR(256) NOT NULL,
    "source_type" "JournalSourceType" NOT NULL,
    "source_id" TEXT,
    "status" "JournalStatus" NOT NULL DEFAULT 'POSTED',
    "reversed_by_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "chart_of_account_id" TEXT NOT NULL,
    "type" "EntryLineType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" VARCHAR(256),

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_budgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "cost_center_id" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "budget_amount" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_terminal_warehouses" (
    "terminal_id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_terminal_warehouses_pkey" PRIMARY KEY ("terminal_id","warehouse_id")
);

-- CreateTable
CREATE TABLE "pos_device_pairings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "device_label" VARCHAR(128) NOT NULL,
    "device_token_hash" VARCHAR(128) NOT NULL,
    "paired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3),
    "paired_by_user_id" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_user_id" TEXT,
    "revoked_reason" VARCHAR(256),

    CONSTRAINT "pos_device_pairings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "portal_name" VARCHAR(64) NOT NULL,
    "portal_edital_id" VARCHAR(128),
    "edital_number" VARCHAR(128) NOT NULL,
    "modality" "BidModality" NOT NULL,
    "criterion_type" "BidCriterion" NOT NULL,
    "legal_framework" "BidLegalFramework" NOT NULL,
    "execution_regime" "BidExecutionRegime",
    "object" TEXT NOT NULL,
    "object_summary" VARCHAR(512),
    "organ_name" VARCHAR(256) NOT NULL,
    "organ_cnpj" VARCHAR(18),
    "organ_state" VARCHAR(2),
    "organ_city" VARCHAR(128),
    "estimated_value" DECIMAL(14,2),
    "our_proposal_value" DECIMAL(14,2),
    "final_value" DECIMAL(14,2),
    "margin" DECIMAL(6,2),
    "publication_date" TIMESTAMP(3),
    "opening_date" TIMESTAMP(3) NOT NULL,
    "closing_date" TIMESTAMP(3),
    "dispute_date" TIMESTAMP(3),
    "status" "BidStatus" NOT NULL DEFAULT 'DISCOVERED',
    "viability_score" INTEGER,
    "viability_reason" VARCHAR(512),
    "customer_id" TEXT,
    "assigned_to_user_id" TEXT,
    "exclusive_me_epp" BOOLEAN NOT NULL DEFAULT false,
    "delivery_states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "edital_url" VARCHAR(1024),
    "edital_file_id" TEXT,
    "etp_file_id" TEXT,
    "tr_file_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "item_number" INTEGER NOT NULL,
    "lot_number" INTEGER,
    "lot_description" VARCHAR(512),
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" VARCHAR(16) NOT NULL,
    "estimated_unit_price" DECIMAL(14,4),
    "our_unit_price" DECIMAL(14,4),
    "final_unit_price" DECIMAL(14,4),
    "status" "BidItemStatus" NOT NULL DEFAULT 'PENDING_BID_ITEM',
    "variant_id" TEXT,
    "match_confidence" DECIMAL(5,2),
    "quota_type" "BidQuotaType",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_proposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BidProposalStatus" NOT NULL DEFAULT 'DRAFT_PROPOSAL',
    "total_value" DECIMAL(14,2) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "proposal_file_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "sent_by_user_id" TEXT,
    "sent_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "portal_confirmation" VARCHAR(256),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT,
    "type" "BidDocumentType" NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" VARCHAR(512),
    "file_id" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "auto_renewable" BOOLEAN NOT NULL DEFAULT false,
    "last_renew_attempt" TIMESTAMP(3),
    "renew_status" "BidDocRenewalStatus",
    "portal_uploaded" BOOLEAN NOT NULL DEFAULT false,
    "portal_uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "contract_number" VARCHAR(128) NOT NULL,
    "status" "BidContractStatus" NOT NULL DEFAULT 'DRAFT_CONTRACT',
    "signed_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_value" DECIMAL(14,2) NOT NULL,
    "remaining_value" DECIMAL(14,2) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "renewal_count" INTEGER NOT NULL DEFAULT 0,
    "max_renewals" INTEGER,
    "renewal_deadline" TIMESTAMP(3),
    "delivery_addresses" JSONB,
    "contract_file_id" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_empenhos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "empenho_number" VARCHAR(128) NOT NULL,
    "type" "BidEmpenhoType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "status" "BidEmpenhoStatus" NOT NULL DEFAULT 'EMITIDO',
    "order_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_empenhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_monitor_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "type" "BidMonitorEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detected_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "portal_data" JSONB,
    "action_required" BOOLEAN NOT NULL DEFAULT false,
    "action_taken" TEXT,
    "action_taken_at" TIMESTAMP(3),
    "action_taken_by_user_id" TEXT,
    "response_deadline" TIMESTAMP(3),
    "response_status" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_monitor_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_history" (
    "id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "action" "BidHistoryAction" NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "metadata" JSONB,
    "performed_by_user_id" TEXT,
    "performed_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "is_reversible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_ai_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "autonomy_level" INTEGER NOT NULL DEFAULT 1,
    "max_edital_value" DECIMAL(14,2),
    "min_margin_percent" DECIMAL(6,2) NOT NULL DEFAULT 10,
    "allowed_modalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blocked_organs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_simultaneous" INTEGER NOT NULL DEFAULT 10,
    "max_aggregate_exposure" DECIMAL(14,2),
    "cooling_off_minutes" INTEGER NOT NULL DEFAULT 30,
    "emergency_stop" BOOLEAN NOT NULL DEFAULT false,
    "first_time_approval" BOOLEAN NOT NULL DEFAULT true,
    "company_size" VARCHAR(16),
    "monitoring_timeout_days" INTEGER NOT NULL DEFAULT 180,
    "auto_prospect" BOOLEAN NOT NULL DEFAULT false,
    "auto_propose" BOOLEAN NOT NULL DEFAULT false,
    "auto_dispute" BOOLEAN NOT NULL DEFAULT false,
    "auto_respond" BOOLEAN NOT NULL DEFAULT false,
    "auto_create_order" BOOLEAN NOT NULL DEFAULT false,
    "notify_on_actions" BOOLEAN NOT NULL DEFAULT true,
    "chat_response_whitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certidao_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "BidDocumentType" NOT NULL,
    "renewal_url" VARCHAR(1024),
    "renewal_method" "BidDocRenewalMethod" NOT NULL,
    "last_check" TIMESTAMP(3),
    "last_renewal" TIMESTAMP(3),
    "next_expiration" TIMESTAMP(3),
    "check_interval_days" INTEGER NOT NULL DEFAULT 7,
    "alert_days_before" INTEGER NOT NULL DEFAULT 15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certidao_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "marketplace" "MarketplaceType" NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "status" "MarketplaceConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "seller_id" VARCHAR(256),
    "seller_name" VARCHAR(256),
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "api_key" VARCHAR(512),
    "api_secret" VARCHAR(512),
    "sync_products" BOOLEAN NOT NULL DEFAULT true,
    "sync_prices" BOOLEAN NOT NULL DEFAULT true,
    "sync_stock" BOOLEAN NOT NULL DEFAULT true,
    "sync_orders" BOOLEAN NOT NULL DEFAULT true,
    "sync_messages" BOOLEAN NOT NULL DEFAULT false,
    "sync_interval_min" INTEGER NOT NULL DEFAULT 15,
    "last_sync_at" TIMESTAMP(3),
    "last_sync_status" VARCHAR(64),
    "last_sync_error" TEXT,
    "price_table_id" TEXT,
    "commission_percent" DECIMAL(6,2),
    "auto_calc_price" BOOLEAN NOT NULL DEFAULT false,
    "price_multiplier" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "fulfillment_type" "MarketplaceFulfillmentType" NOT NULL DEFAULT 'SELF',
    "default_warehouse_id" TEXT,
    "webhook_url" VARCHAR(1024),
    "webhook_secret" VARCHAR(512),
    "settings" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "parent_listing_id" TEXT,
    "external_listing_id" VARCHAR(256) NOT NULL,
    "external_product_id" VARCHAR(256),
    "external_url" VARCHAR(1024),
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'DRAFT',
    "status_reason" VARCHAR(512),
    "last_status_check" TIMESTAMP(3),
    "published_price" DECIMAL(12,2),
    "compare_at_price" DECIMAL(12,2),
    "commission_amount" DECIMAL(12,2),
    "net_price" DECIMAL(12,2),
    "published_stock" INTEGER NOT NULL DEFAULT 0,
    "fulfillment_stock" INTEGER NOT NULL DEFAULT 0,
    "external_category_id" VARCHAR(128),
    "external_category_path" VARCHAR(1024),
    "total_sold" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "buy_box_owner" BOOLEAN NOT NULL DEFAULT false,
    "health_score" INTEGER,
    "has_active_ad" BOOLEAN NOT NULL DEFAULT false,
    "ad_spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last_sync_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_order_id" VARCHAR(256) NOT NULL,
    "external_order_url" VARCHAR(1024),
    "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "marketplace_status" VARCHAR(128),
    "buyer_name" VARCHAR(256) NOT NULL,
    "buyer_document" VARCHAR(32),
    "buyer_email" VARCHAR(256),
    "buyer_phone" VARCHAR(32),
    "customer_id" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "marketplace_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "shipping_method" VARCHAR(128),
    "tracking_code" VARCHAR(128),
    "tracking_url" VARCHAR(1024),
    "shipping_label" TEXT,
    "estimated_delivery" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "delivery_address" JSONB NOT NULL DEFAULT '{}',
    "order_id" TEXT,
    "notes" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL,
    "acknowledged_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_payment_id" VARCHAR(256),
    "marketplace_order_id" TEXT,
    "type" "MarketplacePaymentType" NOT NULL,
    "description" VARCHAR(512),
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "fee_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "installment_number" INTEGER,
    "settlement_date" TIMESTAMP(3),
    "status" "MarketplacePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "finance_entry_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel" "MessagingChannel" NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "status" "MessagingAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone_number" VARCHAR(20),
    "waba_id" VARCHAR(64),
    "ig_account_id" VARCHAR(64),
    "tg_bot_token" TEXT,
    "tg_bot_username" VARCHAR(64),
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "webhook_url" VARCHAR(512),
    "webhook_secret" VARCHAR(256),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_contacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "channel" "MessagingChannel" NOT NULL,
    "external_id" VARCHAR(128) NOT NULL,
    "name" VARCHAR(256),
    "username" VARCHAR(128),
    "avatar_url" VARCHAR(512),
    "customer_id" TEXT,
    "last_message_at" TIMESTAMP(3),
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "channel" "MessagingChannel" NOT NULL,
    "direction" "MessagingDirection" NOT NULL,
    "type" "MessagingMessageType" NOT NULL DEFAULT 'TEXT',
    "status" "MessagingMessageStatus" NOT NULL DEFAULT 'PENDING',
    "text" TEXT,
    "media_url" VARCHAR(1024),
    "media_type" VARCHAR(64),
    "file_name" VARCHAR(256),
    "template_name" VARCHAR(128),
    "template_params" JSONB,
    "external_id" VARCHAR(128),
    "reply_to_message_id" TEXT,
    "error_code" VARCHAR(32),
    "error_message" VARCHAR(512),
    "metadata" JSONB,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messaging_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messaging_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "category" "MessagingTemplateCategory" NOT NULL,
    "status" "MessagingTemplateStatus" NOT NULL DEFAULT 'PENDING',
    "components" JSONB NOT NULL,
    "external_id" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messaging_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" "FiscalProviderType" NOT NULL DEFAULT 'NUVEM_FISCAL',
    "environment" "NfeEnvironment" NOT NULL DEFAULT 'HOMOLOGATION',
    "api_key" TEXT,
    "api_secret" TEXT,
    "default_series" INTEGER NOT NULL DEFAULT 1,
    "last_nfe_number" INTEGER NOT NULL DEFAULT 0,
    "last_nfce_number" INTEGER NOT NULL DEFAULT 0,
    "default_cfop" VARCHAR(10),
    "default_natureza_operacao" VARCHAR(128),
    "taxRegime" "TaxRegimeEnum" NOT NULL DEFAULT 'SIMPLES',
    "nfce_enabled" BOOLEAN NOT NULL DEFAULT false,
    "nfce_csc_id" VARCHAR(10),
    "nfce_csc_token" VARCHAR(128),
    "certificate_id" TEXT,
    "contingency_mode" "FiscalEmissionType" NOT NULL DEFAULT 'NORMAL',
    "contingency_reason" VARCHAR(256),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_certificates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pfx_data" BYTEA NOT NULL,
    "pfx_password" TEXT NOT NULL,
    "serial_number" VARCHAR(64) NOT NULL,
    "issuer" VARCHAR(256) NOT NULL,
    "subject" VARCHAR(256) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "type" "FiscalDocumentType" NOT NULL,
    "series" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "access_key" VARCHAR(44),
    "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "emission_type" "FiscalEmissionType" NOT NULL DEFAULT 'NORMAL',
    "recipient_cnpj_cpf" VARCHAR(14),
    "recipient_name" VARCHAR(256),
    "recipient_ie" VARCHAR(20),
    "natureza_operacao" VARCHAR(128),
    "cfop" VARCHAR(10),
    "total_products" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_shipping" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "xml_sent" TEXT,
    "xml_authorized" TEXT,
    "xml_cancellation" TEXT,
    "danfe_pdf_url" VARCHAR(512),
    "protocol_number" VARCHAR(32),
    "protocol_date" TIMESTAMP(3),
    "external_id" VARCHAR(128),
    "order_id" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" VARCHAR(256),
    "correction_text" TEXT,
    "additional_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_document_items" (
    "id" TEXT NOT NULL,
    "fiscal_document_id" TEXT NOT NULL,
    "item_number" INTEGER NOT NULL,
    "product_id" TEXT,
    "product_name" VARCHAR(256) NOT NULL,
    "product_code" VARCHAR(64),
    "ncm" VARCHAR(8),
    "cest" VARCHAR(7),
    "cfop" VARCHAR(4) NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit_price" DECIMAL(12,4) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cst" VARCHAR(3),
    "icms_base" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "icms_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "icms_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ipi_base" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ipi_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "ipi_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pis_base" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pis_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "pis_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cofins_base" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cofins_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "cofins_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "ibs_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "ibs_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cbs_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "cbs_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_document_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_document_events" (
    "id" TEXT NOT NULL,
    "fiscal_document_id" TEXT NOT NULL,
    "type" "FiscalEventType" NOT NULL,
    "protocol" VARCHAR(32),
    "description" VARCHAR(512),
    "xml_request" TEXT,
    "xml_response" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_code" VARCHAR(32),
    "error_message" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_document_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pix_charges" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tx_id" VARCHAR(64) NOT NULL,
    "location" VARCHAR(512),
    "pix_copia_e_cola" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    "payer_name" VARCHAR(256),
    "payer_cpf_cnpj" VARCHAR(14),
    "end_to_end_id" VARCHAR(64),
    "pos_transaction_payment_id" TEXT,
    "order_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "provider" VARCHAR(32) NOT NULL DEFAULT 'EFI',
    "provider_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pix_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT NOT NULL,
    "natural_prompt" TEXT NOT NULL,
    "trigger_type" "AiWorkflowTrigger" NOT NULL DEFAULT 'MANUAL',
    "trigger_config" JSONB,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_workflow_executions" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "status" "AiWorkflowExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "trigger" VARCHAR(32) NOT NULL,
    "results" JSONB,
    "error" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overdue_escalations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overdue_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overdue_escalation_steps" (
    "id" TEXT NOT NULL,
    "escalation_id" TEXT NOT NULL,
    "days_overdue" INTEGER NOT NULL,
    "channel" "EscalationChannel" NOT NULL,
    "template_type" "EscalationTemplateType" NOT NULL,
    "subject" VARCHAR(256),
    "message" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL,

    CONSTRAINT "overdue_escalation_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overdue_actions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "step_id" TEXT,
    "channel" "EscalationChannel" NOT NULL,
    "status" "EscalationActionStatus" NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "overdue_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "punch_configurations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "selfie_required" BOOLEAN NOT NULL DEFAULT true,
    "gps_required" BOOLEAN NOT NULL DEFAULT true,
    "geofence_enabled" BOOLEAN NOT NULL DEFAULT false,
    "qr_code_enabled" BOOLEAN NOT NULL DEFAULT true,
    "direct_login_enabled" BOOLEAN NOT NULL DEFAULT true,
    "kiosk_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pwa_enabled" BOOLEAN NOT NULL DEFAULT true,
    "offline_allowed" BOOLEAN NOT NULL DEFAULT false,
    "max_offline_hours" INTEGER NOT NULL DEFAULT 24,
    "tolerance_minutes" INTEGER NOT NULL DEFAULT 10,
    "auto_clock_out_hours" INTEGER,
    "pdf_receipt_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_radius_meters" INTEGER NOT NULL DEFAULT 200,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "punch_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_tenant_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "empresa_cidada_enabled" BOOLEAN NOT NULL DEFAULT false,
    "maternity_leave_days" INTEGER NOT NULL DEFAULT 120,
    "paternity_leave_days" INTEGER NOT NULL DEFAULT 5,
    "union_contribution_enabled" BOOLEAN NOT NULL DEFAULT false,
    "union_contribution_rate" DECIMAL(5,4),
    "pat_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pat_monthly_value" DECIMAL(10,2),
    "time_bank_individual_months" INTEGER NOT NULL DEFAULT 6,
    "time_bank_collective_months" INTEGER NOT NULL DEFAULT 12,
    "rat_percent" DECIMAL(3,1) NOT NULL DEFAULT 2,
    "fap_factor" DECIMAL(4,3) NOT NULL DEFAULT 1,
    "terceiros_percent" DECIMAL(4,2) NOT NULL DEFAULT 5.8,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_tenant_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geofence_zones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius_meters" INTEGER NOT NULL DEFAULT 200,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "address" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geofence_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_to_entry_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email_account_id" TEXT NOT NULL,
    "monitored_folder" VARCHAR(256) NOT NULL DEFAULT 'INBOX/Financeiro',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_create" BOOLEAN NOT NULL DEFAULT false,
    "default_type" VARCHAR(16) NOT NULL DEFAULT 'PAYABLE',
    "default_category_id" TEXT,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "last_processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_to_entry_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "environment" "EsocialEnvironment" NOT NULL DEFAULT 'HOMOLOGACAO',
    "auto_generate" BOOLEAN NOT NULL DEFAULT false,
    "require_approval" BOOLEAN NOT NULL DEFAULT true,
    "employer_type" VARCHAR(8) NOT NULL DEFAULT 'CNPJ',
    "employer_document" VARCHAR(18),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esocial_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_certificates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "encrypted_pfx" BYTEA NOT NULL,
    "encryption_iv" VARCHAR(64) NOT NULL,
    "encryption_tag" VARCHAR(64) NOT NULL,
    "serial_number" VARCHAR(128) NOT NULL,
    "issuer" VARCHAR(512) NOT NULL,
    "subject" VARCHAR(512) NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esocial_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" VARCHAR(16) NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "status" "EsocialEventStatus" NOT NULL DEFAULT 'DRAFT',
    "reference_id" TEXT,
    "reference_name" VARCHAR(256),
    "reference_type" VARCHAR(64),
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "xml_content" TEXT,
    "signed_xml" TEXT,
    "batch_id" TEXT,
    "receipt" VARCHAR(128),
    "rejection_code" VARCHAR(32),
    "rejection_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "rectified_event_id" TEXT,
    "created_by" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esocial_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "protocol" VARCHAR(128),
    "status" "EsocialBatchStatus" NOT NULL DEFAULT 'PENDING',
    "environment" "EsocialEnvironment" NOT NULL,
    "total_events" INTEGER NOT NULL DEFAULT 0,
    "accepted_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "transmitted_at" TIMESTAMP(3),
    "checked_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "next_retry_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esocial_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_rubricas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "nature" VARCHAR(8) NOT NULL,
    "type" VARCHAR(16) NOT NULL,
    "incidence" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esocial_rubricas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_event_status_history" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "from_status" VARCHAR(16) NOT NULL,
    "to_status" VARCHAR(16) NOT NULL,
    "changed_by" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "esocial_event_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "esocial_tables" (
    "id" TEXT NOT NULL,
    "table_code" VARCHAR(8) NOT NULL,
    "item_code" VARCHAR(16) NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "esocial_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_approval_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "action" "FinanceApprovalAction" NOT NULL,
    "max_amount" DECIMAL(12,2),
    "conditions" JSONB NOT NULL DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "applied_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "finance_approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_obligations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tax_type" VARCHAR(20) NOT NULL,
    "reference_month" INTEGER NOT NULL,
    "reference_year" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "TaxObligationStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "darf_code" VARCHAR(10),
    "entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "method" "BankPaymentMethod" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "recipient_data" JSONB NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requested_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" VARCHAR(500),
    "external_id" VARCHAR(256),
    "receipt_data" JSONB,
    "receipt_file_id" TEXT,
    "error_message" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_webhook_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "external_id" VARCHAR(256) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payload" JSONB NOT NULL,
    "matched_entry_id" TEXT,
    "auto_settled" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entry_id" TEXT,
    "slug" VARCHAR(32) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "customer_name" VARCHAR(128),
    "expires_at" TIMESTAMP(3),
    "pix_copia_e_cola" VARCHAR(512),
    "boleto_digitable_line" VARCHAR(256),
    "boleto_pdf_url" VARCHAR(512),
    "status" "PaymentLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accountant_accesses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "cpf_cnpj" VARCHAR(18),
    "crc" VARCHAR(20),
    "access_token" VARCHAR(256) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_access_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accountant_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppe_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "ca_number" VARCHAR(50),
    "manufacturer" VARCHAR(200),
    "model" VARCHAR(200),
    "expiration_months" INTEGER,
    "min_stock" INTEGER NOT NULL DEFAULT 0,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ppe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ppe_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ppe_item_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "condition" VARCHAR(20) NOT NULL DEFAULT 'NEW',
    "return_condition" VARCHAR(20),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppe_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offboarding_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "termination_id" TEXT,
    "title" VARCHAR(200) NOT NULL DEFAULT 'Checklist de Desligamento',
    "items" JSONB NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offboarding_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_delegations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "delegator_id" TEXT NOT NULL,
    "delegate_id" TEXT NOT NULL,
    "scope" VARCHAR(30) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "department_id" TEXT,
    "position_id" TEXT,
    "status" "JobPostingStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "JobPostingType" NOT NULL DEFAULT 'FULL_TIME',
    "location" VARCHAR(256),
    "salary_min" DECIMAL(10,2),
    "salary_max" DECIMAL(10,2),
    "requirements" JSONB,
    "benefits" TEXT,
    "max_applicants" INTEGER,
    "published_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "full_name" VARCHAR(256) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(20),
    "cpf" VARCHAR(14),
    "resume_url" VARCHAR(500),
    "linkedin_url" VARCHAR(500),
    "source" "CandidateSource" NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "tags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "current_stage_id" TEXT,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "hired_at" TIMESTAMP(3),
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_stages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "InterviewStageType" NOT NULL DEFAULT 'SCREENING',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "interview_stage_id" TEXT NOT NULL,
    "interviewer_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "location" VARCHAR(256),
    "meeting_url" VARCHAR(500),
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "feedback" TEXT,
    "rating" INTEGER,
    "recommendation" "InterviewRecommendation",
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_payment_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "primary_provider" TEXT NOT NULL,
    "primary_config" TEXT NOT NULL,
    "primary_active" BOOLEAN NOT NULL DEFAULT false,
    "primary_tested_at" TIMESTAMP(3),
    "fallback_provider" TEXT,
    "fallback_config" TEXT,
    "fallback_active" BOOLEAN NOT NULL DEFAULT false,
    "fallback_tested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_charges" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "transaction_payment_id" TEXT,
    "provider" TEXT NOT NULL,
    "provider_charge_id" TEXT,
    "method" "PosPaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentChargeStatus" NOT NULL DEFAULT 'PENDING',
    "qrCode" TEXT,
    "checkout_url" TEXT,
    "boleto_url" TEXT,
    "boleto_barcode" TEXT,
    "paid_at" TIMESTAMP(3),
    "paid_amount" DECIMAL(12,2),
    "expires_at" TIMESTAMP(3),
    "raw_response" JSONB,
    "webhook_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" "InvoiceType" NOT NULL DEFAULT 'NFCE',
    "number" VARCHAR(10) NOT NULL,
    "series" VARCHAR(3) NOT NULL DEFAULT '1',
    "accessKey" VARCHAR(44) NOT NULL,
    "focusIdRef" VARCHAR(255),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "statusDetails" TEXT,
    "xmlUrl" TEXT,
    "pdfUrl" TEXT,
    "xmlContent" TEXT,
    "xml_content_hash" VARCHAR(64),
    "issuedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_printers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "PrinterType" NOT NULL,
    "connection" "PrinterConnection" NOT NULL,
    "ipAddress" VARCHAR(15),
    "port" INTEGER DEFAULT 9100,
    "deviceId" VARCHAR(128),
    "bluetoothAddress" VARCHAR(20),
    "paperWidth" INTEGER NOT NULL DEFAULT 80,
    "encoding" VARCHAR(20) NOT NULL DEFAULT 'UTF-8',
    "characterPerLine" INTEGER NOT NULL DEFAULT 42,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pos_printers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "printer_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" "PrintJobType" NOT NULL,
    "status" "PrintJobStatus" NOT NULL DEFAULT 'CREATED',
    "content" TEXT NOT NULL,
    "templateData" JSONB,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "print_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_nfe_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "productionMode" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultSeries" VARCHAR(3) NOT NULL DEFAULT '1',
    "autoIssueOnConfirm" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_nfe_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shifts_tenant_id_deleted_at_idx" ON "shifts"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "shift_assignments_tenant_id_idx" ON "shift_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "shift_assignments_employee_id_idx" ON "shift_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "shift_assignments_shift_id_idx" ON "shift_assignments"("shift_id");

-- CreateIndex
CREATE INDEX "vacation_splits_vacation_period_id_idx" ON "vacation_splits"("vacation_period_id");

-- CreateIndex
CREATE INDEX "vacation_splits_status_idx" ON "vacation_splits"("status");

-- CreateIndex
CREATE INDEX "vacation_splits_start_date_end_date_idx" ON "vacation_splits"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "vacation_splits_vacation_period_id_split_number_key" ON "vacation_splits"("vacation_period_id", "split_number");

-- CreateIndex
CREATE INDEX "employee_warnings_tenant_id_deleted_at_idx" ON "employee_warnings"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "employee_warnings_employee_id_idx" ON "employee_warnings"("employee_id");

-- CreateIndex
CREATE INDEX "employee_warnings_issued_by_idx" ON "employee_warnings"("issued_by");

-- CreateIndex
CREATE INDEX "employee_warnings_type_idx" ON "employee_warnings"("type");

-- CreateIndex
CREATE INDEX "employee_warnings_status_idx" ON "employee_warnings"("status");

-- CreateIndex
CREATE INDEX "employee_dependants_tenant_id_idx" ON "employee_dependants"("tenant_id");

-- CreateIndex
CREATE INDEX "employee_dependants_employee_id_idx" ON "employee_dependants"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "terminations_employee_id_key" ON "terminations"("employee_id");

-- CreateIndex
CREATE INDEX "terminations_tenant_id_idx" ON "terminations"("tenant_id");

-- CreateIndex
CREATE INDEX "terminations_status_idx" ON "terminations"("status");

-- CreateIndex
CREATE INDEX "medical_exams_tenant_id_idx" ON "medical_exams"("tenant_id");

-- CreateIndex
CREATE INDEX "medical_exams_employee_id_idx" ON "medical_exams"("employee_id");

-- CreateIndex
CREATE INDEX "medical_exams_type_idx" ON "medical_exams"("type");

-- CreateIndex
CREATE INDEX "medical_exams_exam_date_idx" ON "medical_exams"("exam_date");

-- CreateIndex
CREATE INDEX "medical_exams_expiration_date_idx" ON "medical_exams"("expiration_date");

-- CreateIndex
CREATE INDEX "medical_exams_aptitude_idx" ON "medical_exams"("aptitude");

-- CreateIndex
CREATE INDEX "occupational_exam_requirements_tenant_id_idx" ON "occupational_exam_requirements"("tenant_id");

-- CreateIndex
CREATE INDEX "occupational_exam_requirements_position_id_idx" ON "occupational_exam_requirements"("position_id");

-- CreateIndex
CREATE INDEX "occupational_exam_requirements_exam_category_idx" ON "occupational_exam_requirements"("exam_category");

-- CreateIndex
CREATE INDEX "safety_programs_tenant_id_idx" ON "safety_programs"("tenant_id");

-- CreateIndex
CREATE INDEX "safety_programs_type_idx" ON "safety_programs"("type");

-- CreateIndex
CREATE INDEX "safety_programs_status_idx" ON "safety_programs"("status");

-- CreateIndex
CREATE INDEX "safety_programs_valid_from_idx" ON "safety_programs"("valid_from");

-- CreateIndex
CREATE INDEX "safety_programs_valid_until_idx" ON "safety_programs"("valid_until");

-- CreateIndex
CREATE INDEX "workplace_risks_tenant_id_idx" ON "workplace_risks"("tenant_id");

-- CreateIndex
CREATE INDEX "workplace_risks_safety_program_id_idx" ON "workplace_risks"("safety_program_id");

-- CreateIndex
CREATE INDEX "workplace_risks_category_idx" ON "workplace_risks"("category");

-- CreateIndex
CREATE INDEX "workplace_risks_severity_idx" ON "workplace_risks"("severity");

-- CreateIndex
CREATE INDEX "cipa_mandates_tenant_id_idx" ON "cipa_mandates"("tenant_id");

-- CreateIndex
CREATE INDEX "cipa_mandates_status_idx" ON "cipa_mandates"("status");

-- CreateIndex
CREATE INDEX "cipa_mandates_start_date_idx" ON "cipa_mandates"("start_date");

-- CreateIndex
CREATE INDEX "cipa_mandates_end_date_idx" ON "cipa_mandates"("end_date");

-- CreateIndex
CREATE INDEX "cipa_members_tenant_id_idx" ON "cipa_members"("tenant_id");

-- CreateIndex
CREATE INDEX "cipa_members_mandate_id_idx" ON "cipa_members"("mandate_id");

-- CreateIndex
CREATE INDEX "cipa_members_employee_id_idx" ON "cipa_members"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "cipa_members_mandate_id_employee_id_key" ON "cipa_members"("mandate_id", "employee_id");

-- CreateIndex
CREATE INDEX "training_programs_tenant_id_deleted_at_idx" ON "training_programs"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "training_programs_tenant_id_is_active_idx" ON "training_programs"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "training_programs_tenant_id_category_idx" ON "training_programs"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "training_enrollments_tenant_id_idx" ON "training_enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "training_enrollments_tenant_id_employee_id_idx" ON "training_enrollments"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "training_enrollments_tenant_id_training_program_id_idx" ON "training_enrollments"("tenant_id", "training_program_id");

-- CreateIndex
CREATE INDEX "training_enrollments_tenant_id_status_idx" ON "training_enrollments"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "training_enrollments_training_program_id_employee_id_key" ON "training_enrollments"("training_program_id", "employee_id");

-- CreateIndex
CREATE INDEX "review_cycles_tenant_id_deleted_at_idx" ON "review_cycles"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "review_cycles_tenant_id_status_idx" ON "review_cycles"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "review_cycles_tenant_id_is_active_idx" ON "review_cycles"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "performance_reviews_tenant_id_idx" ON "performance_reviews"("tenant_id");

-- CreateIndex
CREATE INDEX "performance_reviews_tenant_id_review_cycle_id_idx" ON "performance_reviews"("tenant_id", "review_cycle_id");

-- CreateIndex
CREATE INDEX "performance_reviews_tenant_id_employee_id_idx" ON "performance_reviews"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "performance_reviews_tenant_id_status_idx" ON "performance_reviews"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "performance_reviews_review_cycle_id_employee_id_key" ON "performance_reviews"("review_cycle_id", "employee_id");

-- CreateIndex
CREATE INDEX "surveys_tenant_id_status_idx" ON "surveys"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "surveys_tenant_id_type_idx" ON "surveys"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "surveys_tenant_id_created_by_idx" ON "surveys"("tenant_id", "created_by");

-- CreateIndex
CREATE INDEX "survey_questions_tenant_id_survey_id_idx" ON "survey_questions"("tenant_id", "survey_id");

-- CreateIndex
CREATE INDEX "survey_questions_survey_id_order_idx" ON "survey_questions"("survey_id", "order");

-- CreateIndex
CREATE INDEX "survey_responses_tenant_id_survey_id_idx" ON "survey_responses"("tenant_id", "survey_id");

-- CreateIndex
CREATE INDEX "survey_responses_tenant_id_employee_id_idx" ON "survey_responses"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "survey_answers_tenant_id_survey_response_id_idx" ON "survey_answers"("tenant_id", "survey_response_id");

-- CreateIndex
CREATE INDEX "survey_answers_tenant_id_question_id_idx" ON "survey_answers"("tenant_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_answers_survey_response_id_question_id_key" ON "survey_answers"("survey_response_id", "question_id");

-- CreateIndex
CREATE INDEX "objectives_tenant_id_status_idx" ON "objectives"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "objectives_tenant_id_owner_id_idx" ON "objectives"("tenant_id", "owner_id");

-- CreateIndex
CREATE INDEX "objectives_tenant_id_level_idx" ON "objectives"("tenant_id", "level");

-- CreateIndex
CREATE INDEX "objectives_tenant_id_period_idx" ON "objectives"("tenant_id", "period");

-- CreateIndex
CREATE INDEX "objectives_tenant_id_parent_id_idx" ON "objectives"("tenant_id", "parent_id");

-- CreateIndex
CREATE INDEX "key_results_tenant_id_objective_id_idx" ON "key_results"("tenant_id", "objective_id");

-- CreateIndex
CREATE INDEX "key_results_tenant_id_status_idx" ON "key_results"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "okr_check_ins_tenant_id_key_result_id_idx" ON "okr_check_ins"("tenant_id", "key_result_id");

-- CreateIndex
CREATE INDEX "okr_check_ins_tenant_id_employee_id_idx" ON "okr_check_ins"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_tenant_id_idx" ON "chart_of_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_parent_id_idx" ON "chart_of_accounts"("parent_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_type_idx" ON "chart_of_accounts"("type");

-- CreateIndex
CREATE INDEX "chart_of_accounts_is_active_idx" ON "chart_of_accounts"("is_active");

-- CreateIndex
CREATE INDEX "chart_of_accounts_deleted_at_idx" ON "chart_of_accounts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_tenant_id_code_key" ON "chart_of_accounts"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_reversed_by_id_key" ON "journal_entries"("reversed_by_id");

-- CreateIndex
CREATE INDEX "journal_entries_tenant_id_date_idx" ON "journal_entries"("tenant_id", "date");

-- CreateIndex
CREATE INDEX "journal_entries_tenant_id_source_type_source_id_idx" ON "journal_entries"("tenant_id", "source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_tenant_id_code_key" ON "journal_entries"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "journal_entry_lines_journal_entry_id_idx" ON "journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_entry_lines_chart_of_account_id_idx" ON "journal_entry_lines"("chart_of_account_id");

-- CreateIndex
CREATE INDEX "finance_budgets_tenant_id_year_idx" ON "finance_budgets"("tenant_id", "year");

-- CreateIndex
CREATE INDEX "finance_budgets_category_id_idx" ON "finance_budgets"("category_id");

-- CreateIndex
CREATE INDEX "finance_budgets_cost_center_id_idx" ON "finance_budgets"("cost_center_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_budgets_tenant_id_category_id_cost_center_id_year_m_key" ON "finance_budgets"("tenant_id", "category_id", "cost_center_id", "year", "month");

-- CreateIndex
CREATE INDEX "pos_terminal_warehouses_warehouse_id_idx" ON "pos_terminal_warehouses"("warehouse_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_device_pairings_terminal_id_key" ON "pos_device_pairings"("terminal_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_device_pairings_device_token_hash_key" ON "pos_device_pairings"("device_token_hash");

-- CreateIndex
CREATE INDEX "pos_device_pairings_tenant_id_idx" ON "pos_device_pairings"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_device_pairings_device_token_hash_idx" ON "pos_device_pairings"("device_token_hash");

-- CreateIndex
CREATE INDEX "bids_tenant_id_idx" ON "bids"("tenant_id");

-- CreateIndex
CREATE INDEX "bids_tenant_id_status_idx" ON "bids"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "bids_tenant_id_opening_date_idx" ON "bids"("tenant_id", "opening_date");

-- CreateIndex
CREATE INDEX "bids_tenant_id_deleted_at_idx" ON "bids"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bids_tenant_id_portal_name_portal_edital_id_key" ON "bids"("tenant_id", "portal_name", "portal_edital_id");

-- CreateIndex
CREATE INDEX "bid_items_bid_id_idx" ON "bid_items"("bid_id");

-- CreateIndex
CREATE INDEX "bid_items_tenant_id_idx" ON "bid_items"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_proposals_bid_id_idx" ON "bid_proposals"("bid_id");

-- CreateIndex
CREATE INDEX "bid_proposals_tenant_id_idx" ON "bid_proposals"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_documents_tenant_id_idx" ON "bid_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_documents_bid_id_idx" ON "bid_documents"("bid_id");

-- CreateIndex
CREATE INDEX "bid_documents_tenant_id_type_idx" ON "bid_documents"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "bid_documents_expiration_date_idx" ON "bid_documents"("expiration_date");

-- CreateIndex
CREATE INDEX "bid_contracts_tenant_id_idx" ON "bid_contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_contracts_tenant_id_status_idx" ON "bid_contracts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "bid_contracts_bid_id_idx" ON "bid_contracts"("bid_id");

-- CreateIndex
CREATE UNIQUE INDEX "bid_contracts_tenant_id_contract_number_key" ON "bid_contracts"("tenant_id", "contract_number");

-- CreateIndex
CREATE INDEX "bid_empenhos_tenant_id_idx" ON "bid_empenhos"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_empenhos_contract_id_idx" ON "bid_empenhos"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "bid_empenhos_tenant_id_empenho_number_key" ON "bid_empenhos"("tenant_id", "empenho_number");

-- CreateIndex
CREATE INDEX "bid_monitor_events_tenant_id_idx" ON "bid_monitor_events"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_monitor_events_bid_id_idx" ON "bid_monitor_events"("bid_id");

-- CreateIndex
CREATE INDEX "bid_monitor_events_tenant_id_type_idx" ON "bid_monitor_events"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "bid_history_bid_id_idx" ON "bid_history"("bid_id");

-- CreateIndex
CREATE INDEX "bid_history_tenant_id_idx" ON "bid_history"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_history_bid_id_created_at_idx" ON "bid_history"("bid_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bid_ai_configs_tenant_id_key" ON "bid_ai_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "certidao_schedules_tenant_id_idx" ON "certidao_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "certidao_schedules_tenant_id_is_active_idx" ON "certidao_schedules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "marketplace_connections_tenant_id_idx" ON "marketplace_connections"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_connections_tenant_id_marketplace_idx" ON "marketplace_connections"("tenant_id", "marketplace");

-- CreateIndex
CREATE INDEX "marketplace_connections_tenant_id_deleted_at_idx" ON "marketplace_connections"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "marketplace_connections_marketplace_seller_id_idx" ON "marketplace_connections"("marketplace", "seller_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_tenant_id_idx" ON "marketplace_listings"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_connection_id_idx" ON "marketplace_listings"("connection_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_variant_id_idx" ON "marketplace_listings"("variant_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_connection_id_external_listing_id_idx" ON "marketplace_listings"("connection_id", "external_listing_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_tenant_id_deleted_at_idx" ON "marketplace_listings"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "marketplace_orders_tenant_id_idx" ON "marketplace_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_orders_connection_id_idx" ON "marketplace_orders"("connection_id");

-- CreateIndex
CREATE INDEX "marketplace_orders_connection_id_external_order_id_idx" ON "marketplace_orders"("connection_id", "external_order_id");

-- CreateIndex
CREATE INDEX "marketplace_orders_tenant_id_status_idx" ON "marketplace_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_orders_tenant_id_deleted_at_idx" ON "marketplace_orders"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "marketplace_orders_received_at_idx" ON "marketplace_orders"("received_at");

-- CreateIndex
CREATE INDEX "marketplace_payments_tenant_id_idx" ON "marketplace_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_payments_connection_id_idx" ON "marketplace_payments"("connection_id");

-- CreateIndex
CREATE INDEX "marketplace_payments_marketplace_order_id_idx" ON "marketplace_payments"("marketplace_order_id");

-- CreateIndex
CREATE INDEX "marketplace_payments_connection_id_status_idx" ON "marketplace_payments"("connection_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_payments_tenant_id_status_idx" ON "marketplace_payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "messaging_accounts_tenant_id_idx" ON "messaging_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "messaging_accounts_tenant_id_channel_idx" ON "messaging_accounts"("tenant_id", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_accounts_tenant_id_channel_phone_number_key" ON "messaging_accounts"("tenant_id", "channel", "phone_number");

-- CreateIndex
CREATE INDEX "messaging_contacts_tenant_id_idx" ON "messaging_contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "messaging_contacts_tenant_id_channel_idx" ON "messaging_contacts"("tenant_id", "channel");

-- CreateIndex
CREATE INDEX "messaging_contacts_tenant_id_last_message_at_idx" ON "messaging_contacts"("tenant_id", "last_message_at");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_contacts_account_id_external_id_key" ON "messaging_contacts"("account_id", "external_id");

-- CreateIndex
CREATE INDEX "messaging_messages_tenant_id_idx" ON "messaging_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "messaging_messages_account_id_contact_id_idx" ON "messaging_messages"("account_id", "contact_id");

-- CreateIndex
CREATE INDEX "messaging_messages_tenant_id_channel_created_at_idx" ON "messaging_messages"("tenant_id", "channel", "created_at");

-- CreateIndex
CREATE INDEX "messaging_messages_contact_id_created_at_idx" ON "messaging_messages"("contact_id", "created_at");

-- CreateIndex
CREATE INDEX "messaging_messages_external_id_idx" ON "messaging_messages"("external_id");

-- CreateIndex
CREATE INDEX "messaging_templates_tenant_id_idx" ON "messaging_templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "messaging_templates_account_id_name_language_key" ON "messaging_templates"("account_id", "name", "language");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_configs_tenant_id_key" ON "fiscal_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_configs_tenant_id_idx" ON "fiscal_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_certificates_tenant_id_idx" ON "fiscal_certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_certificates_tenant_id_valid_until_idx" ON "fiscal_certificates"("tenant_id", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_documents_access_key_key" ON "fiscal_documents"("access_key");

-- CreateIndex
CREATE INDEX "fiscal_documents_tenant_id_idx" ON "fiscal_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "fiscal_documents_tenant_id_type_status_idx" ON "fiscal_documents"("tenant_id", "type", "status");

-- CreateIndex
CREATE INDEX "fiscal_documents_tenant_id_created_at_idx" ON "fiscal_documents"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "fiscal_documents_order_id_idx" ON "fiscal_documents"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_documents_config_id_type_series_number_key" ON "fiscal_documents"("config_id", "type", "series", "number");

-- CreateIndex
CREATE INDEX "fiscal_document_items_fiscal_document_id_idx" ON "fiscal_document_items"("fiscal_document_id");

-- CreateIndex
CREATE INDEX "fiscal_document_events_fiscal_document_id_idx" ON "fiscal_document_events"("fiscal_document_id");

-- CreateIndex
CREATE INDEX "fiscal_document_events_fiscal_document_id_type_idx" ON "fiscal_document_events"("fiscal_document_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "pix_charges_tx_id_key" ON "pix_charges"("tx_id");

-- CreateIndex
CREATE INDEX "pix_charges_tenant_id_idx" ON "pix_charges"("tenant_id");

-- CreateIndex
CREATE INDEX "pix_charges_tenant_id_status_idx" ON "pix_charges"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pix_charges_tx_id_idx" ON "pix_charges"("tx_id");

-- CreateIndex
CREATE INDEX "ai_workflows_tenant_id_is_active_idx" ON "ai_workflows"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "ai_workflows_tenant_id_trigger_type_idx" ON "ai_workflows"("tenant_id", "trigger_type");

-- CreateIndex
CREATE INDEX "ai_workflow_executions_workflow_id_started_at_idx" ON "ai_workflow_executions"("workflow_id", "started_at");

-- CreateIndex
CREATE INDEX "overdue_escalations_tenant_id_idx" ON "overdue_escalations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "overdue_escalations_tenant_id_name_key" ON "overdue_escalations"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "overdue_escalation_steps_escalation_id_idx" ON "overdue_escalation_steps"("escalation_id");

-- CreateIndex
CREATE UNIQUE INDEX "overdue_escalation_steps_escalation_id_days_overdue_channel_key" ON "overdue_escalation_steps"("escalation_id", "days_overdue", "channel");

-- CreateIndex
CREATE INDEX "overdue_actions_tenant_id_idx" ON "overdue_actions"("tenant_id");

-- CreateIndex
CREATE INDEX "overdue_actions_entry_id_idx" ON "overdue_actions"("entry_id");

-- CreateIndex
CREATE INDEX "overdue_actions_step_id_idx" ON "overdue_actions"("step_id");

-- CreateIndex
CREATE UNIQUE INDEX "punch_configurations_tenant_id_key" ON "punch_configurations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_tenant_configs_tenant_id_key" ON "hr_tenant_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "geofence_zones_tenant_id_idx" ON "geofence_zones"("tenant_id");

-- CreateIndex
CREATE INDEX "geofence_zones_tenant_id_is_active_idx" ON "geofence_zones"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "email_to_entry_configs_tenant_id_key" ON "email_to_entry_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_configs_tenant_id_key" ON "esocial_configs"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_certificates_tenant_id_key" ON "esocial_certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "esocial_events_tenant_id_idx" ON "esocial_events"("tenant_id");

-- CreateIndex
CREATE INDEX "esocial_events_tenant_id_status_idx" ON "esocial_events"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "esocial_events_tenant_id_event_type_idx" ON "esocial_events"("tenant_id", "event_type");

-- CreateIndex
CREATE INDEX "esocial_events_batch_id_idx" ON "esocial_events"("batch_id");

-- CreateIndex
CREATE INDEX "esocial_batches_tenant_id_idx" ON "esocial_batches"("tenant_id");

-- CreateIndex
CREATE INDEX "esocial_batches_tenant_id_status_idx" ON "esocial_batches"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "esocial_batches_protocol_idx" ON "esocial_batches"("protocol");

-- CreateIndex
CREATE INDEX "esocial_rubricas_tenant_id_idx" ON "esocial_rubricas"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_rubricas_tenant_id_code_key" ON "esocial_rubricas"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "esocial_event_status_history_event_id_idx" ON "esocial_event_status_history"("event_id");

-- CreateIndex
CREATE INDEX "esocial_tables_table_code_idx" ON "esocial_tables"("table_code");

-- CreateIndex
CREATE UNIQUE INDEX "esocial_tables_table_code_item_code_key" ON "esocial_tables"("table_code", "item_code");

-- CreateIndex
CREATE INDEX "finance_approval_rules_tenant_id_idx" ON "finance_approval_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_approval_rules_tenant_id_is_active_idx" ON "finance_approval_rules"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "finance_approval_rules_tenant_id_name_key" ON "finance_approval_rules"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "tax_obligations_tenant_id_idx" ON "tax_obligations"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_obligations_tenant_id_status_idx" ON "tax_obligations"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tax_obligations_tenant_id_reference_year_reference_month_idx" ON "tax_obligations"("tenant_id", "reference_year", "reference_month");

-- CreateIndex
CREATE INDEX "tax_obligations_due_date_idx" ON "tax_obligations"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "tax_obligations_tenant_id_tax_type_reference_month_referenc_key" ON "tax_obligations"("tenant_id", "tax_type", "reference_month", "reference_year");

-- CreateIndex
CREATE INDEX "payment_orders_tenant_id_idx" ON "payment_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_orders_entry_id_idx" ON "payment_orders"("entry_id");

-- CreateIndex
CREATE INDEX "payment_orders_status_idx" ON "payment_orders"("status");

-- CreateIndex
CREATE INDEX "bank_webhook_events_tenant_id_idx" ON "bank_webhook_events"("tenant_id");

-- CreateIndex
CREATE INDEX "bank_webhook_events_bank_account_id_idx" ON "bank_webhook_events"("bank_account_id");

-- CreateIndex
CREATE INDEX "bank_webhook_events_external_id_idx" ON "bank_webhook_events"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_links_slug_key" ON "payment_links"("slug");

-- CreateIndex
CREATE INDEX "payment_links_tenant_id_idx" ON "payment_links"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_links_slug_idx" ON "payment_links"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "accountant_accesses_access_token_key" ON "accountant_accesses"("access_token");

-- CreateIndex
CREATE INDEX "accountant_accesses_tenant_id_idx" ON "accountant_accesses"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "accountant_accesses_tenant_id_email_key" ON "accountant_accesses"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "ppe_items_tenant_id_deleted_at_idx" ON "ppe_items"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "ppe_assignments_tenant_id_idx" ON "ppe_assignments"("tenant_id");

-- CreateIndex
CREATE INDEX "ppe_assignments_employee_id_idx" ON "ppe_assignments"("employee_id");

-- CreateIndex
CREATE INDEX "ppe_assignments_ppe_item_id_idx" ON "ppe_assignments"("ppe_item_id");

-- CreateIndex
CREATE INDEX "offboarding_checklists_tenant_id_idx" ON "offboarding_checklists"("tenant_id");

-- CreateIndex
CREATE INDEX "offboarding_checklists_tenant_id_deleted_at_idx" ON "offboarding_checklists"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "offboarding_checklists_tenant_id_employee_id_key" ON "offboarding_checklists"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "approval_delegations_tenant_id_idx" ON "approval_delegations"("tenant_id");

-- CreateIndex
CREATE INDEX "approval_delegations_delegator_id_idx" ON "approval_delegations"("delegator_id");

-- CreateIndex
CREATE INDEX "approval_delegations_delegate_id_idx" ON "approval_delegations"("delegate_id");

-- CreateIndex
CREATE INDEX "approval_delegations_tenant_id_delegator_id_is_active_idx" ON "approval_delegations"("tenant_id", "delegator_id", "is_active");

-- CreateIndex
CREATE INDEX "approval_delegations_tenant_id_delegate_id_is_active_idx" ON "approval_delegations"("tenant_id", "delegate_id", "is_active");

-- CreateIndex
CREATE INDEX "job_postings_tenant_id_deleted_at_idx" ON "job_postings"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "job_postings_tenant_id_status_idx" ON "job_postings"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "job_postings_tenant_id_department_id_idx" ON "job_postings"("tenant_id", "department_id");

-- CreateIndex
CREATE INDEX "job_postings_tenant_id_position_id_idx" ON "job_postings"("tenant_id", "position_id");

-- CreateIndex
CREATE INDEX "candidates_tenant_id_deleted_at_idx" ON "candidates"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "candidates_tenant_id_source_idx" ON "candidates"("tenant_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_tenant_id_email_key" ON "candidates"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "applications_tenant_id_job_posting_id_idx" ON "applications"("tenant_id", "job_posting_id");

-- CreateIndex
CREATE INDEX "applications_tenant_id_candidate_id_idx" ON "applications"("tenant_id", "candidate_id");

-- CreateIndex
CREATE INDEX "applications_tenant_id_status_idx" ON "applications"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_tenant_id_job_posting_id_candidate_id_key" ON "applications"("tenant_id", "job_posting_id", "candidate_id");

-- CreateIndex
CREATE INDEX "interview_stages_tenant_id_job_posting_id_idx" ON "interview_stages"("tenant_id", "job_posting_id");

-- CreateIndex
CREATE INDEX "interview_stages_tenant_id_job_posting_id_order_idx" ON "interview_stages"("tenant_id", "job_posting_id", "order");

-- CreateIndex
CREATE INDEX "interviews_tenant_id_application_id_idx" ON "interviews"("tenant_id", "application_id");

-- CreateIndex
CREATE INDEX "interviews_tenant_id_interview_stage_id_idx" ON "interviews"("tenant_id", "interview_stage_id");

-- CreateIndex
CREATE INDEX "interviews_tenant_id_interviewer_id_idx" ON "interviews"("tenant_id", "interviewer_id");

-- CreateIndex
CREATE INDEX "interviews_tenant_id_status_idx" ON "interviews"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_payment_configs_tenant_id_key" ON "tenant_payment_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_charges_tenant_id_idx" ON "payment_charges"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_charges_tenant_id_order_id_idx" ON "payment_charges"("tenant_id", "order_id");

-- CreateIndex
CREATE INDEX "payment_charges_provider_charge_id_idx" ON "payment_charges"("provider_charge_id");

-- CreateIndex
CREATE INDEX "payment_charges_tenant_id_status_idx" ON "payment_charges"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_status_idx" ON "invoices"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "invoices_tenant_id_issuedAt_idx" ON "invoices"("tenant_id", "issuedAt");

-- CreateIndex
CREATE INDEX "invoices_accessKey_idx" ON "invoices"("accessKey");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_tenant_id_number_series_key" ON "invoices"("tenant_id", "number", "series");

-- CreateIndex
CREATE INDEX "pos_printers_tenant_id_idx" ON "pos_printers"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_printers_tenant_id_isDefault_idx" ON "pos_printers"("tenant_id", "isDefault");

-- CreateIndex
CREATE INDEX "print_jobs_tenant_id_status_idx" ON "print_jobs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "print_jobs_printer_id_idx" ON "print_jobs"("printer_id");

-- CreateIndex
CREATE INDEX "print_jobs_order_id_idx" ON "print_jobs"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "focus_nfe_configs_tenant_id_key" ON "focus_nfe_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_entries_pix_charge_id_idx" ON "finance_entries"("pix_charge_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_entry_payments_idempotency_key_key" ON "finance_entry_payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "onboarding_checklists_tenant_id_deleted_at_idx" ON "onboarding_checklists"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_checklists_tenant_id_employee_id_key" ON "onboarding_checklists"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_channel_status_created_at_idx" ON "orders"("tenant_id", "channel", "status", "created_at");

-- CreateIndex
CREATE INDEX "orders_tenant_id_assigned_to_user_id_status_idx" ON "orders"("tenant_id", "assigned_to_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_sale_code_key" ON "orders"("tenant_id", "sale_code");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_terminal_code_key" ON "pos_terminals"("terminal_code");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_totem_code_key" ON "pos_terminals"("totem_code");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_system_user_id_key" ON "pos_terminals"("system_user_id");

-- CreateIndex
CREATE INDEX "pos_terminals_tenant_id_mode_idx" ON "pos_terminals"("tenant_id", "mode");

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime" ADD CONSTRAINT "overtime_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacation_splits" ADD CONSTRAINT "vacation_splits_vacation_period_id_fkey" FOREIGN KEY ("vacation_period_id") REFERENCES "vacation_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_warnings" ADD CONSTRAINT "employee_warnings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_warnings" ADD CONSTRAINT "employee_warnings_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_warnings" ADD CONSTRAINT "employee_warnings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_dependants" ADD CONSTRAINT "employee_dependants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_dependants" ADD CONSTRAINT "employee_dependants_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminations" ADD CONSTRAINT "terminations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminations" ADD CONSTRAINT "terminations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_exams" ADD CONSTRAINT "medical_exams_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_exams" ADD CONSTRAINT "medical_exams_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_exam_requirements" ADD CONSTRAINT "occupational_exam_requirements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "occupational_exam_requirements" ADD CONSTRAINT "occupational_exam_requirements_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_programs" ADD CONSTRAINT "safety_programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workplace_risks" ADD CONSTRAINT "workplace_risks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workplace_risks" ADD CONSTRAINT "workplace_risks_safety_program_id_fkey" FOREIGN KEY ("safety_program_id") REFERENCES "safety_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cipa_mandates" ADD CONSTRAINT "cipa_mandates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cipa_members" ADD CONSTRAINT "cipa_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cipa_members" ADD CONSTRAINT "cipa_members_mandate_id_fkey" FOREIGN KEY ("mandate_id") REFERENCES "cipa_mandates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cipa_members" ADD CONSTRAINT "cipa_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_training_program_id_fkey" FOREIGN KEY ("training_program_id") REFERENCES "training_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_review_cycle_id_fkey" FOREIGN KEY ("review_cycle_id") REFERENCES "review_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_survey_response_id_fkey" FOREIGN KEY ("survey_response_id") REFERENCES "survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_answers" ADD CONSTRAINT "survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objectives" ADD CONSTRAINT "objectives_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_results" ADD CONSTRAINT "key_results_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "okr_check_ins" ADD CONSTRAINT "okr_check_ins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "okr_check_ins" ADD CONSTRAINT "okr_check_ins_key_result_id_fkey" FOREIGN KEY ("key_result_id") REFERENCES "key_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "okr_check_ins" ADD CONSTRAINT "okr_check_ins_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reversed_by_id_fkey" FOREIGN KEY ("reversed_by_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_chart_of_account_id_fkey" FOREIGN KEY ("chart_of_account_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_pix_charge_id_fkey" FOREIGN KEY ("pix_charge_id") REFERENCES "pix_charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_fiscal_document_id_fkey" FOREIGN KEY ("fiscal_document_id") REFERENCES "fiscal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cashier_user_id_fkey" FOREIGN KEY ("cashier_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pos_session_id_fkey" FOREIGN KEY ("pos_session_id") REFERENCES "pos_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_system_user_id_fkey" FOREIGN KEY ("system_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_warehouses" ADD CONSTRAINT "pos_terminal_warehouses_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_warehouses" ADD CONSTRAINT "pos_terminal_warehouses_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_device_pairings" ADD CONSTRAINT "pos_device_pairings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_device_pairings" ADD CONSTRAINT "pos_device_pairings_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_edital_file_id_fkey" FOREIGN KEY ("edital_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_etp_file_id_fkey" FOREIGN KEY ("etp_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tr_file_id_fkey" FOREIGN KEY ("tr_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_items" ADD CONSTRAINT "bid_items_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_items" ADD CONSTRAINT "bid_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_proposal_file_id_fkey" FOREIGN KEY ("proposal_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_contract_file_id_fkey" FOREIGN KEY ("contract_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_empenhos" ADD CONSTRAINT "bid_empenhos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_empenhos" ADD CONSTRAINT "bid_empenhos_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "bid_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_monitor_events" ADD CONSTRAINT "bid_monitor_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_monitor_events" ADD CONSTRAINT "bid_monitor_events_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_monitor_events" ADD CONSTRAINT "bid_monitor_events_action_taken_by_user_id_fkey" FOREIGN KEY ("action_taken_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_history" ADD CONSTRAINT "bid_history_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_history" ADD CONSTRAINT "bid_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_history" ADD CONSTRAINT "bid_history_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_ai_configs" ADD CONSTRAINT "bid_ai_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certidao_schedules" ADD CONSTRAINT "certidao_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_connections" ADD CONSTRAINT "marketplace_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_parent_listing_id_fkey" FOREIGN KEY ("parent_listing_id") REFERENCES "marketplace_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_marketplace_order_id_fkey" FOREIGN KEY ("marketplace_order_id") REFERENCES "marketplace_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_accounts" ADD CONSTRAINT "messaging_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_contacts" ADD CONSTRAINT "messaging_contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_contacts" ADD CONSTRAINT "messaging_contacts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "messaging_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_contacts" ADD CONSTRAINT "messaging_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "messaging_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_messages" ADD CONSTRAINT "messaging_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "messaging_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_templates" ADD CONSTRAINT "messaging_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messaging_templates" ADD CONSTRAINT "messaging_templates_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "messaging_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_configs" ADD CONSTRAINT "fiscal_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_configs" ADD CONSTRAINT "fiscal_configs_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "fiscal_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_certificates" ADD CONSTRAINT "fiscal_certificates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "fiscal_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_document_items" ADD CONSTRAINT "fiscal_document_items_fiscal_document_id_fkey" FOREIGN KEY ("fiscal_document_id") REFERENCES "fiscal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_document_events" ADD CONSTRAINT "fiscal_document_events_fiscal_document_id_fkey" FOREIGN KEY ("fiscal_document_id") REFERENCES "fiscal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_charges" ADD CONSTRAINT "pix_charges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflows" ADD CONSTRAINT "ai_workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflows" ADD CONSTRAINT "ai_workflows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_workflow_executions" ADD CONSTRAINT "ai_workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "ai_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overdue_escalations" ADD CONSTRAINT "overdue_escalations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overdue_escalation_steps" ADD CONSTRAINT "overdue_escalation_steps_escalation_id_fkey" FOREIGN KEY ("escalation_id") REFERENCES "overdue_escalations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overdue_actions" ADD CONSTRAINT "overdue_actions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overdue_actions" ADD CONSTRAINT "overdue_actions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overdue_actions" ADD CONSTRAINT "overdue_actions_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "overdue_escalation_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "punch_configurations" ADD CONSTRAINT "punch_configurations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_tenant_configs" ADD CONSTRAINT "hr_tenant_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_zones" ADD CONSTRAINT "geofence_zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_to_entry_configs" ADD CONSTRAINT "email_to_entry_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_configs" ADD CONSTRAINT "esocial_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_certificates" ADD CONSTRAINT "esocial_certificates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_events" ADD CONSTRAINT "esocial_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_events" ADD CONSTRAINT "esocial_events_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "esocial_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_batches" ADD CONSTRAINT "esocial_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_rubricas" ADD CONSTRAINT "esocial_rubricas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "esocial_event_status_history" ADD CONSTRAINT "esocial_event_status_history_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "esocial_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_approval_rules" ADD CONSTRAINT "finance_approval_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_obligations" ADD CONSTRAINT "tax_obligations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_obligations" ADD CONSTRAINT "tax_obligations_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_webhook_events" ADD CONSTRAINT "bank_webhook_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_webhook_events" ADD CONSTRAINT "bank_webhook_events_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accountant_accesses" ADD CONSTRAINT "accountant_accesses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppe_items" ADD CONSTRAINT "ppe_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppe_assignments" ADD CONSTRAINT "ppe_assignments_ppe_item_id_fkey" FOREIGN KEY ("ppe_item_id") REFERENCES "ppe_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppe_assignments" ADD CONSTRAINT "ppe_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppe_assignments" ADD CONSTRAINT "ppe_assignments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offboarding_checklists" ADD CONSTRAINT "offboarding_checklists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offboarding_checklists" ADD CONSTRAINT "offboarding_checklists_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_invites" ADD CONSTRAINT "admission_invites_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_invites" ADD CONSTRAINT "admission_invites_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegator_id_fkey" FOREIGN KEY ("delegator_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_delegate_id_fkey" FOREIGN KEY ("delegate_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_delegations" ADD CONSTRAINT "approval_delegations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_current_stage_id_fkey" FOREIGN KEY ("current_stage_id") REFERENCES "interview_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_stages" ADD CONSTRAINT "interview_stages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_stages" ADD CONSTRAINT "interview_stages_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interview_stage_id_fkey" FOREIGN KEY ("interview_stage_id") REFERENCES "interview_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_payment_configs" ADD CONSTRAINT "tenant_payment_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_charges" ADD CONSTRAINT "payment_charges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_charges" ADD CONSTRAINT "payment_charges_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_printers" ADD CONSTRAINT "pos_printers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_jobs" ADD CONSTRAINT "print_jobs_printer_id_fkey" FOREIGN KEY ("printer_id") REFERENCES "pos_printers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_nfe_configs" ADD CONSTRAINT "focus_nfe_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
