-- CreateEnum
CREATE TYPE "LeadRoutingStrategy" AS ENUM ('ROUND_ROBIN', 'TERRITORY', 'SEGMENT', 'LOAD_BALANCE');

-- CreateEnum
CREATE TYPE "ReconciliationSuggestionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'SENT', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WorkflowTrigger" AS ENUM ('ORDER_CREATED', 'ORDER_CONFIRMED', 'DEAL_WON', 'DEAL_LOST', 'CUSTOMER_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED');

-- CreateEnum
CREATE TYPE "WorkflowStepType" AS ENUM ('SEND_EMAIL', 'SEND_NOTIFICATION', 'UPDATE_STATUS', 'CREATE_TASK');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'NUMBER', 'EMAIL', 'PHONE', 'SELECT', 'CHECKBOX', 'TEXTAREA', 'DATE');

-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "CashierSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "CashierTransactionType" AS ENUM ('SALE', 'REFUND', 'CASH_IN', 'CASH_OUT');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CadenceStepType" AS ENUM ('EMAIL', 'CALL', 'TASK', 'LINKEDIN', 'WHATSAPP', 'WAIT');

-- CreateEnum
CREATE TYPE "CadenceEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "LandingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuthLinkProvider" AS ENUM ('EMAIL', 'CPF', 'ENROLLMENT', 'GOOGLE', 'MICROSOFT', 'APPLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "AuthLinkStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'ACTIVATE';
ALTER TYPE "AuditAction" ADD VALUE 'DEACTIVATE';
ALTER TYPE "AuditAction" ADD VALUE 'EXECUTE';
ALTER TYPE "AuditAction" ADD VALUE 'ENROLL';
ALTER TYPE "AuditAction" ADD VALUE 'ADVANCE_STEP';
ALTER TYPE "AuditAction" ADD VALUE 'PROCESS_PENDING';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntity" ADD VALUE 'LEAD_ROUTING_RULE';
ALTER TYPE "AuditEntity" ADD VALUE 'QUOTE';
ALTER TYPE "AuditEntity" ADD VALUE 'QUOTE_ITEM';
ALTER TYPE "AuditEntity" ADD VALUE 'PROPOSAL';
ALTER TYPE "AuditEntity" ADD VALUE 'PROPOSAL_ITEM';
ALTER TYPE "AuditEntity" ADD VALUE 'PROPOSAL_ATTACHMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'DISCOUNT_RULE';
ALTER TYPE "AuditEntity" ADD VALUE 'WORKFLOW';
ALTER TYPE "AuditEntity" ADD VALUE 'WORKFLOW_STEP';
ALTER TYPE "AuditEntity" ADD VALUE 'CONVERSATION';
ALTER TYPE "AuditEntity" ADD VALUE 'CONVERSATION_MESSAGE';
ALTER TYPE "AuditEntity" ADD VALUE 'FORM';
ALTER TYPE "AuditEntity" ADD VALUE 'FORM_FIELD';
ALTER TYPE "AuditEntity" ADD VALUE 'FORM_SUBMISSION';
ALTER TYPE "AuditEntity" ADD VALUE 'LANDING_PAGE';
ALTER TYPE "AuditEntity" ADD VALUE 'MESSAGE_TEMPLATE';
ALTER TYPE "AuditEntity" ADD VALUE 'CASHIER_SESSION';
ALTER TYPE "AuditEntity" ADD VALUE 'PROCESS_BLUEPRINT';
ALTER TYPE "AuditEntity" ADD VALUE 'BLUEPRINT_STAGE_RULE';
ALTER TYPE "AuditEntity" ADD VALUE 'CASHIER_TRANSACTION';
ALTER TYPE "AuditEntity" ADD VALUE 'LEAD_SCORING_RULE';
ALTER TYPE "AuditEntity" ADD VALUE 'LEAD_SCORE';
ALTER TYPE "AuditEntity" ADD VALUE 'CHATBOT_CONFIG';
ALTER TYPE "AuditEntity" ADD VALUE 'DEAL_PREDICTION';
ALTER TYPE "AuditEntity" ADD VALUE 'INTEGRATION';
ALTER TYPE "AuditEntity" ADD VALUE 'TENANT_INTEGRATION';
ALTER TYPE "AuditEntity" ADD VALUE 'CADENCE_SEQUENCE';
ALTER TYPE "AuditEntity" ADD VALUE 'CADENCE_STEP';
ALTER TYPE "AuditEntity" ADD VALUE 'CADENCE_ENROLLMENT';

-- DropIndex
DROP INDEX "contracts_company_id_idx";

-- AlterTable
ALTER TABLE "customer_portal_accesses" ADD COLUMN     "customer_name" VARCHAR(256);

-- AlterTable
ALTER TABLE "finance_entries" ADD COLUMN     "company_id" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- DropTable
DROP TABLE "exchange_rates";

-- CreateTable
CREATE TABLE "process_blueprints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "process_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprint_stage_rules" (
    "id" TEXT NOT NULL,
    "blueprint_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "required_fields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "validations" JSONB NOT NULL DEFAULT '[]',
    "blocks_advance" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blueprint_stage_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "provider" VARCHAR(128),
    "policy_number" VARCHAR(64),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefit_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "benefit_plan_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    "employee_contribution" DECIMAL(10,2) DEFAULT 0,
    "employer_contribution" DECIMAL(10,2) DEFAULT 0,
    "dependant_ids" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefit_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flex_benefit_allocations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "total_budget" DECIMAL(10,2) NOT NULL,
    "allocations" JSONB NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flex_benefit_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_suggestions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "match_reasons" TEXT[],
    "status" "ReconciliationSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashflow_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "predicted_inflow" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "predicted_outflow" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "actual_inflow" DECIMAL(15,2),
    "actual_outflow" DECIMAL(15,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashflow_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "valid_until" TIMESTAMP(3),
    "notes" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "signature_envelope_id" TEXT,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_items" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "product_name" VARCHAR(255) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "valid_until" TIMESTAMP(3),
    "terms" TEXT,
    "total_value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "signature_envelope_id" TEXT,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_attachments" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" VARCHAR(1024) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(12,4) NOT NULL,
    "min_order_value" DECIMAL(12,2),
    "min_quantity" INTEGER,
    "category_id" TEXT,
    "product_id" TEXT,
    "customer_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_stackable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "trigger" "WorkflowTrigger" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "last_executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "WorkflowStepType" NOT NULL,
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "subject" VARCHAR(500) NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "last_message_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "overall_sentiment" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "sender_name" VARCHAR(255) NOT NULL,
    "sender_type" VARCHAR(20) NOT NULL DEFAULT 'AGENT',
    "content" TEXT NOT NULL,
    "sentiment" VARCHAR(20),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "greeting" VARCHAR(500) NOT NULL DEFAULT 'Olá! Como posso ajudar?',
    "auto_reply_message" TEXT,
    "assign_to_user_id" TEXT,
    "form_id" TEXT,
    "primary_color" VARCHAR(7) NOT NULL DEFAULT '#6366f1',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_predictions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "estimated_close_date" TIMESTAMP(3),
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "factors" JSONB NOT NULL DEFAULT '[]',
    "model_version" VARCHAR(10) NOT NULL DEFAULT 'v1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "submission_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_fields" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "type" "FormFieldType" NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "submitted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "channel" "MessageChannel" NOT NULL,
    "subject" VARCHAR(500),
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashier_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cashier_id" TEXT NOT NULL,
    "pos_terminal_id" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opening_balance" DECIMAL(12,2) NOT NULL,
    "closing_balance" DECIMAL(12,2),
    "expected_balance" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "status" "CashierSessionStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashier_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashier_transactions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "CashierTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" VARCHAR(500),
    "payment_method" VARCHAR(50),
    "reference_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashier_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scoring_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "field" VARCHAR(100) NOT NULL,
    "condition" VARCHAR(50) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "points" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lead_scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "tier" VARCHAR(20) NOT NULL DEFAULT 'COLD',
    "factors" JSONB NOT NULL DEFAULT '[]',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_sequences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cadence_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_steps" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "CadenceStepType" NOT NULL,
    "delay_days" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_enrollments" (
    "id" TEXT NOT NULL,
    "sequence_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "deal_id" TEXT,
    "current_step_order" INTEGER NOT NULL DEFAULT 1,
    "status" "CadenceEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "next_action_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cadence_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "template" VARCHAR(50) NOT NULL DEFAULT 'lead-capture',
    "content" JSONB NOT NULL DEFAULT '{}',
    "form_id" TEXT,
    "status" "LandingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "logo_url" VARCHAR(500),
    "category" VARCHAR(50) NOT NULL,
    "config_schema" JSONB NOT NULL DEFAULT '{}',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_integrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DISCONNECTED',
    "last_sync_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_routing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "strategy" "LeadRoutingStrategy" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "assign_to_users" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_leads_per_user" INTEGER,
    "last_assigned_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lead_routing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "data" JSONB NOT NULL DEFAULT '{}',
    "approver_employee_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "author_employee_id" TEXT,
    "target_department_ids" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_kudos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_employee_id" TEXT NOT NULL,
    "to_employee_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_kudos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_invites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "full_name" VARCHAR(255) NOT NULL,
    "position_id" TEXT,
    "department_id" TEXT,
    "company_id" TEXT,
    "expected_start_date" TIMESTAMP(3),
    "salary" DECIMAL(12,2),
    "contract_type" VARCHAR(30) DEFAULT 'CLT',
    "work_regime" VARCHAR(30) DEFAULT 'FULL_TIME',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "candidate_data" JSONB,
    "expires_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "employee_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_documents" (
    "id" TEXT NOT NULL,
    "admission_invite_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "file_name" VARCHAR(500) NOT NULL,
    "file_url" VARCHAR(1000) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "admission_invite_id" TEXT,
    "document_id" TEXT,
    "signer_name" VARCHAR(255) NOT NULL,
    "signer_cpf" VARCHAR(14),
    "signer_email" VARCHAR(255),
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT NOT NULL,
    "document_hash" VARCHAR(128) NOT NULL,
    "pin_verified" BOOLEAN NOT NULL DEFAULT false,
    "signature_type" VARCHAR(50) NOT NULL,

    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "provider" "AuthLinkProvider" NOT NULL,
    "identifier" VARCHAR(320) NOT NULL,
    "credential" VARCHAR(100),
    "metadata" JSONB,
    "status" "AuthLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlinkedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_auth_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "allowedMethods" JSONB NOT NULL DEFAULT '["EMAIL"]',
    "magicLinkEnabled" BOOLEAN NOT NULL DEFAULT false,
    "magicLinkExpiresIn" INTEGER NOT NULL DEFAULT 15,
    "defaultMethod" VARCHAR(32),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_auth_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_link_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_link_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "process_blueprints_tenant_id_idx" ON "process_blueprints"("tenant_id");

-- CreateIndex
CREATE INDEX "process_blueprints_pipeline_id_idx" ON "process_blueprints"("pipeline_id");

-- CreateIndex
CREATE INDEX "blueprint_stage_rules_blueprint_id_idx" ON "blueprint_stage_rules"("blueprint_id");

-- CreateIndex
CREATE INDEX "blueprint_stage_rules_stage_id_idx" ON "blueprint_stage_rules"("stage_id");

-- CreateIndex
CREATE INDEX "benefit_plans_tenant_id_type_idx" ON "benefit_plans"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "benefit_plans_tenant_id_is_active_idx" ON "benefit_plans"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "benefit_enrollments_tenant_id_employee_id_idx" ON "benefit_enrollments"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "benefit_enrollments_tenant_id_benefit_plan_id_idx" ON "benefit_enrollments"("tenant_id", "benefit_plan_id");

-- CreateIndex
CREATE INDEX "benefit_enrollments_tenant_id_status_idx" ON "benefit_enrollments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "flex_benefit_allocations_tenant_id_month_year_idx" ON "flex_benefit_allocations"("tenant_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "flex_benefit_allocations_tenant_id_employee_id_month_year_key" ON "flex_benefit_allocations"("tenant_id", "employee_id", "month", "year");

-- CreateIndex
CREATE INDEX "reconciliation_suggestions_tenant_id_idx" ON "reconciliation_suggestions"("tenant_id");

-- CreateIndex
CREATE INDEX "reconciliation_suggestions_transaction_id_idx" ON "reconciliation_suggestions"("transaction_id");

-- CreateIndex
CREATE INDEX "reconciliation_suggestions_entry_id_idx" ON "reconciliation_suggestions"("entry_id");

-- CreateIndex
CREATE INDEX "reconciliation_suggestions_status_idx" ON "reconciliation_suggestions"("status");

-- CreateIndex
CREATE INDEX "cashflow_snapshots_tenant_id_idx" ON "cashflow_snapshots"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "cashflow_snapshots_tenant_id_date_key" ON "cashflow_snapshots"("tenant_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_signature_envelope_id_key" ON "quotes"("signature_envelope_id");

-- CreateIndex
CREATE INDEX "quotes_tenant_id_idx" ON "quotes"("tenant_id");

-- CreateIndex
CREATE INDEX "quotes_customer_id_idx" ON "quotes"("customer_id");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quote_items_quote_id_idx" ON "quote_items"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_signature_envelope_id_key" ON "proposals"("signature_envelope_id");

-- CreateIndex
CREATE INDEX "proposals_tenant_id_idx" ON "proposals"("tenant_id");

-- CreateIndex
CREATE INDEX "proposals_customer_id_idx" ON "proposals"("customer_id");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposal_items_proposal_id_idx" ON "proposal_items"("proposal_id");

-- CreateIndex
CREATE INDEX "proposal_attachments_proposal_id_idx" ON "proposal_attachments"("proposal_id");

-- CreateIndex
CREATE INDEX "discount_rules_tenant_id_idx" ON "discount_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "discount_rules_is_active_start_date_end_date_idx" ON "discount_rules"("is_active", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "workflows_tenant_id_idx" ON "workflows"("tenant_id");

-- CreateIndex
CREATE INDEX "workflows_trigger_is_active_idx" ON "workflows"("trigger", "is_active");

-- CreateIndex
CREATE INDEX "workflow_steps_workflow_id_idx" ON "workflow_steps"("workflow_id");

-- CreateIndex
CREATE INDEX "conversations_tenant_id_idx" ON "conversations"("tenant_id");

-- CreateIndex
CREATE INDEX "conversations_customer_id_idx" ON "conversations"("customer_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversation_messages_conversation_id_idx" ON "conversation_messages"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_configs_tenant_id_key" ON "chatbot_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "deal_predictions_tenant_id_deal_id_idx" ON "deal_predictions"("tenant_id", "deal_id");

-- CreateIndex
CREATE INDEX "forms_tenant_id_idx" ON "forms"("tenant_id");

-- CreateIndex
CREATE INDEX "forms_status_idx" ON "forms"("status");

-- CreateIndex
CREATE INDEX "form_fields_form_id_idx" ON "form_fields"("form_id");

-- CreateIndex
CREATE INDEX "form_submissions_form_id_idx" ON "form_submissions"("form_id");

-- CreateIndex
CREATE INDEX "message_templates_tenant_id_idx" ON "message_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "message_templates_channel_idx" ON "message_templates"("channel");

-- CreateIndex
CREATE INDEX "cashier_sessions_tenant_id_idx" ON "cashier_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "cashier_sessions_cashier_id_status_idx" ON "cashier_sessions"("cashier_id", "status");

-- CreateIndex
CREATE INDEX "cashier_transactions_session_id_idx" ON "cashier_transactions"("session_id");

-- CreateIndex
CREATE INDEX "lead_scoring_rules_tenant_id_idx" ON "lead_scoring_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "lead_scores_tenant_id_idx" ON "lead_scores"("tenant_id");

-- CreateIndex
CREATE INDEX "lead_scores_score_idx" ON "lead_scores"("score");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scores_tenant_id_customer_id_key" ON "lead_scores"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "cadence_sequences_tenant_id_idx" ON "cadence_sequences"("tenant_id");

-- CreateIndex
CREATE INDEX "cadence_sequences_is_active_idx" ON "cadence_sequences"("is_active");

-- CreateIndex
CREATE INDEX "cadence_steps_sequence_id_idx" ON "cadence_steps"("sequence_id");

-- CreateIndex
CREATE INDEX "cadence_enrollments_sequence_id_idx" ON "cadence_enrollments"("sequence_id");

-- CreateIndex
CREATE INDEX "cadence_enrollments_tenant_id_idx" ON "cadence_enrollments"("tenant_id");

-- CreateIndex
CREATE INDEX "cadence_enrollments_status_next_action_at_idx" ON "cadence_enrollments"("status", "next_action_at");

-- CreateIndex
CREATE INDEX "landing_pages_tenant_id_idx" ON "landing_pages"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_tenant_id_slug_key" ON "landing_pages"("tenant_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_slug_key" ON "integrations"("slug");

-- CreateIndex
CREATE INDEX "tenant_integrations_tenant_id_idx" ON "tenant_integrations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_integrations_tenant_id_integration_id_key" ON "tenant_integrations"("tenant_id", "integration_id");

-- CreateIndex
CREATE INDEX "lead_routing_rules_tenant_id_idx" ON "lead_routing_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "lead_routing_rules_is_active_idx" ON "lead_routing_rules"("is_active");

-- CreateIndex
CREATE INDEX "employee_requests_tenant_id_employee_id_idx" ON "employee_requests"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "employee_requests_tenant_id_status_idx" ON "employee_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "company_announcements_tenant_id_is_active_idx" ON "company_announcements"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "employee_kudos_tenant_id_to_employee_id_idx" ON "employee_kudos"("tenant_id", "to_employee_id");

-- CreateIndex
CREATE INDEX "employee_kudos_tenant_id_created_at_idx" ON "employee_kudos"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_checklists_employee_id_key" ON "onboarding_checklists"("employee_id");

-- CreateIndex
CREATE INDEX "onboarding_checklists_tenant_id_idx" ON "onboarding_checklists"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "admission_invites_token_key" ON "admission_invites"("token");

-- CreateIndex
CREATE INDEX "admission_invites_tenant_id_status_idx" ON "admission_invites"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "admission_invites_token_idx" ON "admission_invites"("token");

-- CreateIndex
CREATE INDEX "admission_documents_admission_invite_id_idx" ON "admission_documents"("admission_invite_id");

-- CreateIndex
CREATE INDEX "digital_signatures_admission_invite_id_idx" ON "digital_signatures"("admission_invite_id");

-- CreateIndex
CREATE INDEX "auth_links_userId_status_idx" ON "auth_links"("userId", "status");

-- CreateIndex
CREATE INDEX "auth_links_identifier_idx" ON "auth_links"("identifier");

-- CreateIndex
CREATE INDEX "auth_links_tenantId_idx" ON "auth_links"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_links_provider_identifier_unlinkedAt_key" ON "auth_links"("provider", "identifier", "unlinkedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_auth_configs_tenantId_key" ON "tenant_auth_configs"("tenantId");

-- CreateIndex
CREATE INDEX "magic_link_tokens_token_idx" ON "magic_link_tokens"("token");

-- CreateIndex
CREATE INDEX "finance_entries_company_id_idx" ON "finance_entries"("company_id");

-- CreateIndex
CREATE INDEX "finance_entries_tenant_id_company_id_idx" ON "finance_entries"("tenant_id", "company_id");

-- AddForeignKey
ALTER TABLE "process_blueprints" ADD CONSTRAINT "process_blueprints_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_blueprints" ADD CONSTRAINT "process_blueprints_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_stage_rules" ADD CONSTRAINT "blueprint_stage_rules_blueprint_id_fkey" FOREIGN KEY ("blueprint_id") REFERENCES "process_blueprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_plans" ADD CONSTRAINT "benefit_plans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_enrollments" ADD CONSTRAINT "benefit_enrollments_benefit_plan_id_fkey" FOREIGN KEY ("benefit_plan_id") REFERENCES "benefit_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flex_benefit_allocations" ADD CONSTRAINT "flex_benefit_allocations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flex_benefit_allocations" ADD CONSTRAINT "flex_benefit_allocations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_suggestions" ADD CONSTRAINT "reconciliation_suggestions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_suggestions" ADD CONSTRAINT "reconciliation_suggestions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "bank_reconciliation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_suggestions" ADD CONSTRAINT "reconciliation_suggestions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashflow_snapshots" ADD CONSTRAINT "cashflow_snapshots_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_signature_envelope_id_fkey" FOREIGN KEY ("signature_envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_signature_envelope_id_fkey" FOREIGN KEY ("signature_envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_attachments" ADD CONSTRAINT "proposal_attachments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_configs" ADD CONSTRAINT "chatbot_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_predictions" ADD CONSTRAINT "deal_predictions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_predictions" ADD CONSTRAINT "deal_predictions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier_sessions" ADD CONSTRAINT "cashier_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier_sessions" ADD CONSTRAINT "cashier_sessions_pos_terminal_id_fkey" FOREIGN KEY ("pos_terminal_id") REFERENCES "pos_terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashier_transactions" ADD CONSTRAINT "cashier_transactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "cashier_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scoring_rules" ADD CONSTRAINT "lead_scoring_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_sequences" ADD CONSTRAINT "cadence_sequences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_steps" ADD CONSTRAINT "cadence_steps_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "cadence_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_enrollments" ADD CONSTRAINT "cadence_enrollments_sequence_id_fkey" FOREIGN KEY ("sequence_id") REFERENCES "cadence_sequences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_enrollments" ADD CONSTRAINT "cadence_enrollments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_integrations" ADD CONSTRAINT "tenant_integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_integrations" ADD CONSTRAINT "tenant_integrations_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_routing_rules" ADD CONSTRAINT "lead_routing_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_requests" ADD CONSTRAINT "employee_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_announcements" ADD CONSTRAINT "company_announcements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_kudos" ADD CONSTRAINT "employee_kudos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_checklists" ADD CONSTRAINT "onboarding_checklists_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_invites" ADD CONSTRAINT "admission_invites_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_admission_invite_id_fkey" FOREIGN KEY ("admission_invite_id") REFERENCES "admission_invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_admission_invite_id_fkey" FOREIGN KEY ("admission_invite_id") REFERENCES "admission_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_links" ADD CONSTRAINT "auth_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_links" ADD CONSTRAINT "auth_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_auth_configs" ADD CONSTRAINT "tenant_auth_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magic_link_tokens" ADD CONSTRAINT "magic_link_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

