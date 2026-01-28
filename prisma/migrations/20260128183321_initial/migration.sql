-- CreateEnum
CREATE TYPE "CompanyStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TaxRegimeEnum" AS ENUM ('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'IMUNE_ISENTA', 'OUTROS');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('COMPANY', 'SUPPLIER', 'MANUFACTURER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "OrganizationStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('METERS', 'KILOGRAMS', 'UNITS');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('SALE', 'PRODUCTION', 'SAMPLE', 'LOSS', 'TRANSFER', 'INVENTORY_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'SESSION_REFRESH', 'SESSION_EXPIRE', 'SESSION_REVOKE', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_COMPLETE', 'PASSWORD_FORCE_RESET', 'EMAIL_CHANGE', 'USERNAME_CHANGE', 'PROFILE_CHANGE', 'ROLE_CHANGE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE', 'PERMISSION_UPDATE', 'GROUP_ASSIGN', 'GROUP_REMOVE', 'PERMISSION_ADD_TO_GROUP', 'PERMISSION_REMOVE_FROM_GROUP', 'PRICE_CHANGE', 'STOCK_ENTRY', 'STOCK_EXIT', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'ORDER_CREATE', 'ORDER_CANCEL', 'STATUS_CHANGE', 'RESERVATION_CREATE', 'RESERVATION_RELEASE', 'EMPLOYEE_HIRE', 'EMPLOYEE_TERMINATE', 'EMPLOYEE_TRANSFER', 'EMPLOYEE_LINK_USER', 'CLOCK_IN', 'CLOCK_OUT', 'TIME_CALCULATE', 'TIME_BANK_CREDIT', 'TIME_BANK_DEBIT', 'TIME_BANK_ADJUST', 'ABSENCE_REQUEST', 'ABSENCE_APPROVE', 'ABSENCE_REJECT', 'ABSENCE_CANCEL', 'VACATION_SCHEDULE', 'VACATION_START', 'VACATION_COMPLETE', 'VACATION_CANCEL', 'VACATION_SELL', 'OVERTIME_REQUEST', 'OVERTIME_APPROVE', 'PAYROLL_CREATE', 'PAYROLL_CALCULATE', 'PAYROLL_APPROVE', 'PAYROLL_CANCEL', 'PAYROLL_PAY', 'REQUEST_CREATE', 'REQUEST_ASSIGN', 'REQUEST_COMPLETE', 'REQUEST_CANCEL', 'REQUEST_COMMENT', 'REQUEST_INFO', 'REQUEST_INFO_PROVIDE', 'NOTIFICATION_SEND', 'NOTIFICATION_READ', 'NOTIFICATION_DELETE', 'CHECK_CPF', 'CHECK_CNPJ', 'EXPORT', 'IMPORT', 'SYNC', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditEntity" AS ENUM ('USER', 'USER_PROFILE', 'USER_EMAIL', 'USER_PASSWORD', 'USER_USERNAME', 'USER_ROLE', 'SESSION', 'REFRESH_TOKEN', 'PERMISSION', 'PERMISSION_GROUP', 'PERMISSION_GROUP_PERMISSION', 'USER_PERMISSION_GROUP', 'USER_DIRECT_PERMISSION', 'PRODUCT', 'VARIANT', 'ITEM', 'CATEGORY', 'SUPPLIER', 'MANUFACTURER', 'LOCATION', 'TEMPLATE', 'ITEM_MOVEMENT', 'PRODUCT_CATEGORY', 'VARIANT_PRICE_HISTORY', 'TAG', 'PRODUCT_TAG', 'VARIANT_IMAGE', 'PURCHASE_ORDER', 'PURCHASE_ORDER_ITEM', 'UNIT_CONVERSION', 'STOCK_SNAPSHOT', 'VARIANT_SUPPLIER_CODE', 'VARIANT_PROMOTION', 'CUSTOMER', 'SALES_ORDER', 'SALES_ORDER_ITEM', 'ITEM_RESERVATION', 'ALERT', 'NOTIFICATION', 'NOTIFICATION_TEMPLATE', 'NOTIFICATION_PREFERENCE', 'COMMENT', 'REQUEST', 'REQUEST_ATTACHMENT', 'REQUEST_COMMENT', 'REQUEST_HISTORY', 'COMPANY', 'COMPANY_ADDRESS', 'COMPANY_CNAE', 'COMPANY_FISCAL_SETTINGS', 'COMPANY_STAKEHOLDER', 'EMPLOYEE', 'DEPARTMENT', 'POSITION', 'TIME_ENTRY', 'WORK_SCHEDULE', 'OVERTIME', 'TIME_BANK', 'ABSENCE', 'VACATION_PERIOD', 'VACATION_BALANCE', 'PAYROLL', 'PAYROLL_ITEM', 'BONUS', 'DEDUCTION', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('CORE', 'AUTH', 'RBAC', 'STOCK', 'SALES', 'HR', 'PAYROLL', 'REQUESTS', 'NOTIFICATIONS', 'SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'DAMAGED', 'EXPIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'PRICE_CHANGE', 'REORDER_POINT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'ZONE', 'AISLE', 'RACK', 'SHELF', 'BIN', 'FLOOR', 'ROOM', 'OTHER');

-- CreateEnum
CREATE TYPE "BinLabeling" AS ENUM ('LETTERS', 'NUMBERS');

-- CreateEnum
CREATE TYPE "BinDirection" AS ENUM ('BOTTOM_UP', 'TOP_DOWN');

-- CreateEnum
CREATE TYPE "LayoutAnnotationType" AS ENUM ('DOOR', 'PILLAR', 'WALL', 'LABEL', 'AREA');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ERROR', 'SUCCESS', 'REMINDER');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "VolumeStatus" AS ENUM ('OPEN', 'CLOSED', 'DELIVERED', 'RETURNED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('ACCESS_REQUEST', 'PURCHASE_REQUEST', 'APPROVAL_REQUEST', 'ACTION_REQUEST', 'CHANGE_REQUEST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'PENDING_INFO', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RequestTargetType" AS ENUM ('USER', 'GROUP');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'VACATION', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CLT', 'PJ', 'INTERN', 'TEMPORARY', 'APPRENTICE');

-- CreateEnum
CREATE TYPE "WorkRegime" AS ENUM ('FULL_TIME', 'PART_TIME', 'HOURLY', 'SHIFT', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "TimeEntryType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END', 'OVERTIME_START', 'OVERTIME_END');

-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('VACATION', 'SICK_LEAVE', 'PERSONAL_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'BEREAVEMENT_LEAVE', 'WEDDING_LEAVE', 'MEDICAL_APPOINTMENT', 'JURY_DUTY', 'UNPAID_LEAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PROCESSING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayrollItemType" AS ENUM ('BASE_SALARY', 'BONUS', 'COMMISSION', 'OVERTIME', 'NIGHT_SHIFT', 'HAZARD_PAY', 'DANGER_PAY', 'VACATION_PAY', 'THIRTEENTH_SALARY', 'HOLIDAY', 'INSS', 'IRRF', 'FGTS', 'HEALTH_INSURANCE', 'DENTAL_PLAN', 'TRANSPORT_VOUCHER', 'MEAL_VOUCHER', 'OTHER_BENEFIT', 'ADVANCE', 'LOAN', 'OTHER_DEDUCTION');

-- CreateEnum
CREATE TYPE "CompanyAddressType" AS ENUM ('FISCAL', 'DELIVERY', 'BILLING', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanyCnaeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "NfeEnvironment" AS ENUM ('HOMOLOGATION', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "DigitalCertificateType" AS ENUM ('NONE', 'A1', 'A3');

-- CreateEnum
CREATE TYPE "CompanyStakeholderRole" AS ENUM ('SOCIO', 'ADMINISTRADOR', 'PROCURADOR', 'REPRESENTANTE_LEGAL', 'GERENTE', 'DIRETOR', 'OUTRO');

-- CreateEnum
CREATE TYPE "CompanyStakeholderStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CompanyStakeholderSource" AS ENUM ('CNPJ_API', 'MANUAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(32),
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "last_login_ip" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "blocked_until" TIMESTAMP(3),
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "force_password_reset" BOOLEAN NOT NULL DEFAULT false,
    "force_password_reset_reason" VARCHAR(255),
    "force_password_reset_requested_by" TEXT,
    "force_password_reset_requested_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL DEFAULT '',
    "surname" VARCHAR(64) NOT NULL DEFAULT '',
    "birthday" DATE,
    "location" VARCHAR(128) NOT NULL DEFAULT '',
    "bio" VARCHAR(256) NOT NULL DEFAULT '',
    "avatar_url" VARCHAR(512) NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ip" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "user_agent" VARCHAR(512),
    "device_type" VARCHAR(32),
    "device_name" VARCHAR(128),
    "browser_name" VARCHAR(64),
    "browser_version" VARCHAR(32),
    "os_name" VARCHAR(64),
    "os_version" VARCHAR(32),
    "country" VARCHAR(64),
    "country_code" VARCHAR(2),
    "region" VARCHAR(64),
    "city" VARCHAR(64),
    "timezone" VARCHAR(64),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "trust_verified_at" TIMESTAMP(3),
    "login_method" VARCHAR(32),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "token" VARCHAR(2048) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(128) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(64) NOT NULL,
    "resource" VARCHAR(64) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_groups" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" VARCHAR(7),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_group_permissions" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "effect" VARCHAR(10) NOT NULL DEFAULT 'allow',
    "conditions" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_group_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permission_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "granted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_direct_permissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "effect" VARCHAR(10) NOT NULL DEFAULT 'allow',
    "conditions" JSONB DEFAULT '{}',
    "expires_at" TIMESTAMP(3),
    "granted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_direct_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_code" VARCHAR(128) NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "reason" VARCHAR(512),
    "resource" VARCHAR(64),
    "resource_id" TEXT,
    "action" VARCHAR(64),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "endpoint" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "legal_name" VARCHAR(256) NOT NULL,
    "cnpj" VARCHAR(18),
    "cpf" VARCHAR(14),
    "trade_name" VARCHAR(256),
    "state_registration" VARCHAR(128),
    "municipal_registration" VARCHAR(128),
    "legal_nature" VARCHAR(256),
    "tax_regime" "TaxRegimeEnum",
    "tax_regime_detail" VARCHAR(256),
    "activity_start_date" TIMESTAMP(3),
    "status" "OrganizationStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "email" VARCHAR(256),
    "phone_main" VARCHAR(20),
    "phone_alt" VARCHAR(20),
    "website" VARCHAR(512),
    "logo_url" VARCHAR(512),
    "type_specific_data" JSONB DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_addresses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "CompanyAddressType" NOT NULL DEFAULT 'OTHER',
    "street" VARCHAR(256),
    "number" VARCHAR(32),
    "complement" VARCHAR(128),
    "district" VARCHAR(128),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip" VARCHAR(10) NOT NULL,
    "ibge_city_code" VARCHAR(16),
    "country_code" VARCHAR(4) DEFAULT 'BR',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_cnaes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "description" VARCHAR(256),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyCnaeStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_cnaes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_fiscal_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "nfe_enabled" BOOLEAN DEFAULT false,
    "nfe_series" INTEGER,
    "nfe_number" INTEGER DEFAULT 1,
    "nfe_environment" "NfeEnvironment",
    "nfe_password" VARCHAR(128),
    "nfe_certificate" TEXT,
    "nfe_cert_type" "DigitalCertificateType",
    "default_icms_rate" DECIMAL(5,2) DEFAULT 0,
    "default_ipi_rate" DECIMAL(5,2) DEFAULT 0,
    "default_pis_rate" DECIMAL(5,2) DEFAULT 0,
    "default_cofins_rate" DECIMAL(5,2) DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_fiscal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_stakeholders" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "cpf" VARCHAR(14),
    "role" "CompanyStakeholderRole",
    "qualification" VARCHAR(256),
    "entry_date" TIMESTAMP(3),
    "exit_date" TIMESTAMP(3),
    "status" "CompanyStakeholderStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "CompanyStakeholderSource" DEFAULT 'MANUAL',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "sequential_code" SERIAL NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "cnpj" VARCHAR(18),
    "tax_id" VARCHAR(32),
    "contact" VARCHAR(128),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "website" VARCHAR(512),
    "address" VARCHAR(256),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(64),
    "payment_terms" VARCHAR(256),
    "rating" DECIMAL(3,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "sequential_code" SERIAL NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "country" VARCHAR(64),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "website" VARCHAR(512),
    "address" VARCHAR(256),
    "city" VARCHAR(128),
    "state" VARCHAR(64),
    "zip_code" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "rating" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "parent_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "address" VARCHAR(256),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "structure" JSONB NOT NULL DEFAULT '{}',
    "layout" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bins" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "address" VARCHAR(32) NOT NULL,
    "aisle" INTEGER NOT NULL,
    "shelf" INTEGER NOT NULL,
    "position" VARCHAR(3) NOT NULL,
    "capacity" INTEGER,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "block_reason" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volumes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" VARCHAR(256),
    "status" "VolumeStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "destinationRef" VARCHAR(256),
    "sales_order_id" TEXT,
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "delivered_by" TEXT,

    CONSTRAINT "volumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volume_items" (
    "id" TEXT NOT NULL,
    "volume_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" TEXT NOT NULL,

    CONSTRAINT "volume_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(3),
    "sequential_code" SERIAL NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "icon_url" VARCHAR(512),
    "unit_of_measure" "UnitOfMeasure" NOT NULL DEFAULT 'UNITS',
    "product_attributes" JSONB NOT NULL DEFAULT '{}',
    "variant_attributes" JSONB NOT NULL DEFAULT '{}',
    "item_attributes" JSONB NOT NULL DEFAULT '{}',
    "care_label" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "slug" VARCHAR(300) NOT NULL,
    "full_code" VARCHAR(20) NOT NULL,
    "sequential_code" SERIAL NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "out_of_line" BOOLEAN NOT NULL DEFAULT false,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "barcode" VARCHAR(30) NOT NULL,
    "ean_code" VARCHAR(13) NOT NULL,
    "upc_code" VARCHAR(12) NOT NULL,
    "qr_code" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "care_instruction_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "template_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "manufacturer_id" TEXT,
    "organization_id" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" TEXT NOT NULL,
    "sku" VARCHAR(64),
    "slug" VARCHAR(300) NOT NULL,
    "full_code" VARCHAR(24) NOT NULL,
    "sequential_code" INTEGER NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "image_url" VARCHAR(512),
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cost_price" DECIMAL(10,2),
    "profit_margin" DECIMAL(5,2),
    "barcode" VARCHAR(30) NOT NULL,
    "ean_code" VARCHAR(13) NOT NULL,
    "upc_code" VARCHAR(12) NOT NULL,
    "qr_code" VARCHAR(512),
    "color_hex" VARCHAR(7),
    "color_pantone" VARCHAR(32),
    "min_stock" DECIMAL(10,3),
    "max_stock" DECIMAL(10,3),
    "reorder_point" DECIMAL(10,3),
    "reorder_quantity" DECIMAL(10,3),
    "reference" VARCHAR(128),
    "similars" JSONB DEFAULT '[]',
    "out_of_line" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "product_id" TEXT NOT NULL,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "unique_code" VARCHAR(128),
    "slug" VARCHAR(300) NOT NULL,
    "full_code" VARCHAR(30) NOT NULL,
    "sequential_code" INTEGER NOT NULL,
    "initial_quantity" DECIMAL(10,3) NOT NULL,
    "current_quantity" DECIMAL(10,3) NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "status" "ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "barcode" VARCHAR(30) NOT NULL,
    "ean_code" VARCHAR(13) NOT NULL,
    "upc_code" VARCHAR(12) NOT NULL,
    "qr_code" VARCHAR(512),
    "batch_number" VARCHAR(64),
    "manufacturing_date" DATE,
    "expiry_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "variant_id" TEXT NOT NULL,
    "bin_id" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_movements" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "quantity_before" DECIMAL(10,3),
    "quantity_after" DECIMAL(10,3),
    "movement_type" "MovementType" NOT NULL,
    "reason_code" VARCHAR(64),
    "destination_ref" VARCHAR(128),
    "batch_number" VARCHAR(64),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "approved_by" TEXT,
    "sales_order_id" TEXT,

    CONSTRAINT "item_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_price_history" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "old_price" DECIMAL(10,2),
    "new_price" DECIMAL(10,2) NOT NULL,
    "reason" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "variant_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" "AuditEntity" NOT NULL,
    "module" "AuditModule" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" VARCHAR(512),
    "old_data" JSONB,
    "new_data" JSONB,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "endpoint" VARCHAR(256),
    "method" VARCHAR(10),
    "user_id" TEXT,
    "affected_user" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "color" VARCHAR(7),
    "description" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tags" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_images" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "alt" VARCHAR(256),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "entity_id" TEXT NOT NULL,
    "message" VARCHAR(512) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(64) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_cost" DECIMAL(10,2) NOT NULL,
    "expected_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "supplier_id" TEXT NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_conversions" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "fromUnit" VARCHAR(32) NOT NULL,
    "toUnit" VARCHAR(32) NOT NULL,
    "factor" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_snapshots" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "bin_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "total_value" DECIMAL(12,2) NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "document" VARCHAR(18),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "address" VARCHAR(256),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(64),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(64) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "final_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "customer_id" TEXT NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "total_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_reservations" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "reason" VARCHAR(256),
    "reference" VARCHAR(128),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "item_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_supplier_codes" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_supplier_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_promotions" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "variant_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(32) NOT NULL,
    "entityId" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "parent_comment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "title_template" VARCHAR(256) NOT NULL,
    "message_template" TEXT NOT NULL,
    "default_channel" "NotificationChannel" NOT NULL,
    "default_priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "channel" "NotificationChannel" NOT NULL,
    "action_url" VARCHAR(512),
    "action_text" VARCHAR(64),
    "entity_type" VARCHAR(32),
    "entity_id" VARCHAR(36),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_for" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "category" VARCHAR(100),
    "status" "RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "requester_id" TEXT NOT NULL,
    "target_type" "RequestTargetType" NOT NULL,
    "target_id" TEXT,
    "assigned_to_id" TEXT,
    "due_date" TIMESTAMP(3),
    "sla_deadline" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approval_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_attachments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(512) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_comments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_history" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by_id" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "registration_number" VARCHAR(32) NOT NULL,
    "user_id" TEXT,
    "fullName" VARCHAR(256) NOT NULL,
    "socialName" VARCHAR(256),
    "birth_date" TIMESTAMP(3),
    "gender" VARCHAR(32),
    "pcd" BOOLEAN NOT NULL DEFAULT false,
    "maritalStatus" VARCHAR(32),
    "nationality" VARCHAR(64),
    "birthPlace" VARCHAR(128),
    "emergency_contact_info" JSONB,
    "health_conditions" JSONB,
    "cpf" VARCHAR(14) NOT NULL,
    "rg" VARCHAR(20),
    "rg_issuer" VARCHAR(32),
    "rg_issue_date" TIMESTAMP(3),
    "pis" VARCHAR(14),
    "ctpsNumber" VARCHAR(32),
    "ctpsSeries" VARCHAR(16),
    "ctpsState" VARCHAR(2),
    "voterTitle" VARCHAR(16),
    "militaryDoc" VARCHAR(32),
    "email" VARCHAR(254),
    "personal_email" VARCHAR(254),
    "phone" VARCHAR(20),
    "mobile_phone" VARCHAR(20),
    "emergency_contact" VARCHAR(128),
    "emergency_phone" VARCHAR(20),
    "address" VARCHAR(256),
    "addressNumber" VARCHAR(16),
    "complement" VARCHAR(128),
    "neighborhood" VARCHAR(128),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(64) NOT NULL DEFAULT 'Brasil',
    "bankCode" VARCHAR(8),
    "bankName" VARCHAR(128),
    "bankAgency" VARCHAR(16),
    "bankAccount" VARCHAR(32),
    "bankAccountType" VARCHAR(32),
    "pixKey" VARCHAR(128),
    "department_id" TEXT,
    "position_id" TEXT,
    "supervisor_id" TEXT,
    "organization_id" TEXT,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "termination_date" TIMESTAMP(3),
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "base_salary" DECIMAL(10,2) NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "work_regime" "WorkRegime" NOT NULL,
    "weekly_hours" DECIMAL(5,2) NOT NULL,
    "photo_url" VARCHAR(512),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "manager_id" TEXT,
    "company_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "department_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "min_salary" DECIMAL(10,2),
    "max_salary" DECIMAL(10,2),
    "base_salary" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "entry_type" "TimeEntryType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "ip_address" VARCHAR(64),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "monday_start" VARCHAR(5),
    "monday_end" VARCHAR(5),
    "tuesday_start" VARCHAR(5),
    "tuesday_end" VARCHAR(5),
    "wednesday_start" VARCHAR(5),
    "wednesday_end" VARCHAR(5),
    "thursday_start" VARCHAR(5),
    "thursday_end" VARCHAR(5),
    "friday_start" VARCHAR(5),
    "friday_end" VARCHAR(5),
    "saturday_start" VARCHAR(5),
    "saturday_end" VARCHAR(5),
    "sunday_start" VARCHAR(5),
    "sunday_end" VARCHAR(5),
    "break_duration" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "overtime" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_banks" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "balance" DECIMAL(8,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "status" "AbsenceStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT,
    "document_url" VARCHAR(512),
    "cid" VARCHAR(10),
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "is_inss_responsibility" BOOLEAN NOT NULL DEFAULT false,
    "vacation_period_id" TEXT,
    "notes" TEXT,
    "requested_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vacation_periods" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "acquisition_start" TIMESTAMP(3) NOT NULL,
    "acquisition_end" TIMESTAMP(3) NOT NULL,
    "concession_start" TIMESTAMP(3) NOT NULL,
    "concession_end" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL DEFAULT 30,
    "used_days" INTEGER NOT NULL DEFAULT 0,
    "sold_days" INTEGER NOT NULL DEFAULT 0,
    "remaining_days" INTEGER NOT NULL DEFAULT 30,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacation_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "reference_month" INTEGER NOT NULL,
    "reference_year" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "total_gross" DECIMAL(12,2) NOT NULL,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "total_net" DECIMAL(12,2) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "paid_at" TIMESTAMP(3),
    "paid_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "PayrollItemType" NOT NULL,
    "description" VARCHAR(256) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "is_deduction" BOOLEAN NOT NULL DEFAULT false,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonuses" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deductions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "installments" INTEGER,
    "current_installment" INTEGER NOT NULL DEFAULT 0,
    "is_applied" BOOLEAN NOT NULL DEFAULT false,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "legal_name" VARCHAR(256) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "trade_name" VARCHAR(256),
    "state_registration" VARCHAR(128),
    "municipal_registration" VARCHAR(128),
    "legal_nature" VARCHAR(256),
    "tax_regime" "TaxRegimeEnum",
    "tax_regime_detail" VARCHAR(256),
    "activity_start_date" TIMESTAMP(3),
    "status" "CompanyStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "email" VARCHAR(256),
    "phone_main" VARCHAR(20),
    "phone_alt" VARCHAR(20),
    "logo_url" VARCHAR(512),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pendingIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_addresses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "type" "CompanyAddressType" NOT NULL DEFAULT 'OTHER',
    "street" VARCHAR(256),
    "number" VARCHAR(32),
    "complement" VARCHAR(128),
    "district" VARCHAR(128),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip" VARCHAR(10) NOT NULL,
    "ibge_city_code" VARCHAR(16),
    "country_code" VARCHAR(4) DEFAULT 'BR',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_cnaes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "description" VARCHAR(256),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyCnaeStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_cnaes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_fiscal_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "nfe_environment" "NfeEnvironment",
    "nfe_series" VARCHAR(16),
    "nfe_last_number" INTEGER,
    "nfe_default_operation_nature" VARCHAR(256),
    "nfe_default_cfop" VARCHAR(8),
    "digital_certificate_type" "DigitalCertificateType" NOT NULL DEFAULT 'NONE',
    "certificate_a1_pfx_blob" BYTEA,
    "certificate_a1_password" TEXT,
    "certificate_a1_expires_at" TIMESTAMP(3),
    "nfce_enabled" BOOLEAN NOT NULL DEFAULT false,
    "nfce_csc_id" VARCHAR(64),
    "nfce_csc_token" VARCHAR(256),
    "default_tax_profile_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_fiscal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_stakeholders" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "role" "CompanyStakeholderRole",
    "entry_date" DATE,
    "exit_date" DATE,
    "person_document_masked" VARCHAR(32),
    "is_legal_representative" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyStakeholderStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "CompanyStakeholderSource" NOT NULL DEFAULT 'MANUAL',
    "raw_payload_ref" VARCHAR(512),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "anonimized_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "label_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "grapes_js_data" TEXT NOT NULL,
    "compiled_html" TEXT,
    "compiled_css" TEXT,
    "thumbnail_url" VARCHAR(500),
    "organization_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "label_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_failed_login_attempts_blocked_until_last_login_ip_idx" ON "users"("failed_login_attempts", "blocked_until", "last_login_ip");

-- CreateIndex
CREATE INDEX "users_password_reset_token_password_reset_expires_idx" ON "users"("password_reset_token", "password_reset_expires");

-- CreateIndex
CREATE INDEX "users_force_password_reset_idx" ON "users"("force_password_reset");

-- CreateIndex
CREATE INDEX "users_id_deleted_at_idx" ON "users"("id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_deleted_at_key" ON "users"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_deleted_at_key" ON "users"("username", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_ip_idx" ON "sessions"("ip");

-- CreateIndex
CREATE INDEX "sessions_device_type_idx" ON "sessions"("device_type");

-- CreateIndex
CREATE INDEX "sessions_country_idx" ON "sessions"("country");

-- CreateIndex
CREATE INDEX "sessions_is_trusted_idx" ON "sessions"("is_trusted");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_idx" ON "refresh_tokens"("session_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_resource_action_idx" ON "permissions"("module", "resource", "action");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permission_groups_slug_idx" ON "permission_groups"("slug");

-- CreateIndex
CREATE INDEX "permission_groups_is_active_idx" ON "permission_groups"("is_active");

-- CreateIndex
CREATE INDEX "permission_groups_parent_id_idx" ON "permission_groups"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_name_deleted_at_key" ON "permission_groups"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_slug_deleted_at_key" ON "permission_groups"("slug", "deleted_at");

-- CreateIndex
CREATE INDEX "permission_group_permissions_group_id_idx" ON "permission_group_permissions"("group_id");

-- CreateIndex
CREATE INDEX "permission_group_permissions_permission_id_idx" ON "permission_group_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_group_permissions_group_id_permission_id_key" ON "permission_group_permissions"("group_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_permission_groups_user_id_idx" ON "user_permission_groups"("user_id");

-- CreateIndex
CREATE INDEX "user_permission_groups_group_id_idx" ON "user_permission_groups"("group_id");

-- CreateIndex
CREATE INDEX "user_permission_groups_expires_at_idx" ON "user_permission_groups"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_groups_user_id_group_id_key" ON "user_permission_groups"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "user_direct_permissions_user_id_idx" ON "user_direct_permissions"("user_id");

-- CreateIndex
CREATE INDEX "user_direct_permissions_permission_id_idx" ON "user_direct_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_direct_permissions_expires_at_idx" ON "user_direct_permissions"("expires_at");

-- CreateIndex
CREATE INDEX "user_direct_permissions_effect_idx" ON "user_direct_permissions"("effect");

-- CreateIndex
CREATE UNIQUE INDEX "user_direct_permissions_user_id_permission_id_key" ON "user_direct_permissions"("user_id", "permission_id");

-- CreateIndex
CREATE INDEX "permission_audit_logs_user_id_idx" ON "permission_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "permission_audit_logs_permission_code_idx" ON "permission_audit_logs"("permission_code");

-- CreateIndex
CREATE INDEX "permission_audit_logs_allowed_idx" ON "permission_audit_logs"("allowed");

-- CreateIndex
CREATE INDEX "permission_audit_logs_created_at_idx" ON "permission_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "permission_audit_logs_user_id_created_at_idx" ON "permission_audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "organizations_cnpj_idx" ON "organizations"("cnpj");

-- CreateIndex
CREATE INDEX "organizations_cpf_idx" ON "organizations"("cpf");

-- CreateIndex
CREATE INDEX "organizations_legal_name_idx" ON "organizations"("legal_name");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE INDEX "organizations_created_at_idx" ON "organizations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_type_deleted_at_key" ON "organizations"("cnpj", "type", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cpf_type_deleted_at_key" ON "organizations"("cpf", "type", "deleted_at");

-- CreateIndex
CREATE INDEX "organization_addresses_organization_id_idx" ON "organization_addresses"("organization_id");

-- CreateIndex
CREATE INDEX "organization_addresses_type_idx" ON "organization_addresses"("type");

-- CreateIndex
CREATE INDEX "organization_addresses_zip_idx" ON "organization_addresses"("zip");

-- CreateIndex
CREATE INDEX "organization_addresses_is_primary_idx" ON "organization_addresses"("is_primary");

-- CreateIndex
CREATE INDEX "organization_addresses_deleted_at_idx" ON "organization_addresses"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_addresses_created_at_idx" ON "organization_addresses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_addresses_organization_id_type_deleted_at_key" ON "organization_addresses"("organization_id", "type", "deleted_at");

-- CreateIndex
CREATE INDEX "organization_cnaes_organization_id_idx" ON "organization_cnaes"("organization_id");

-- CreateIndex
CREATE INDEX "organization_cnaes_code_idx" ON "organization_cnaes"("code");

-- CreateIndex
CREATE INDEX "organization_cnaes_is_primary_idx" ON "organization_cnaes"("is_primary");

-- CreateIndex
CREATE INDEX "organization_cnaes_status_idx" ON "organization_cnaes"("status");

-- CreateIndex
CREATE INDEX "organization_cnaes_deleted_at_idx" ON "organization_cnaes"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_cnaes_created_at_idx" ON "organization_cnaes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_cnaes_organization_id_code_deleted_at_key" ON "organization_cnaes"("organization_id", "code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_fiscal_settings_organization_id_key" ON "organization_fiscal_settings"("organization_id");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_organization_id_idx" ON "organization_fiscal_settings"("organization_id");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_deleted_at_idx" ON "organization_fiscal_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_created_at_idx" ON "organization_fiscal_settings"("created_at");

-- CreateIndex
CREATE INDEX "organization_stakeholders_organization_id_idx" ON "organization_stakeholders"("organization_id");

-- CreateIndex
CREATE INDEX "organization_stakeholders_cpf_idx" ON "organization_stakeholders"("cpf");

-- CreateIndex
CREATE INDEX "organization_stakeholders_status_idx" ON "organization_stakeholders"("status");

-- CreateIndex
CREATE INDEX "organization_stakeholders_deleted_at_idx" ON "organization_stakeholders"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_stakeholders_created_at_idx" ON "organization_stakeholders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_stakeholders_organization_id_cpf_deleted_at_key" ON "organization_stakeholders"("organization_id", "cpf", "deleted_at");

-- CreateIndex
CREATE INDEX "suppliers_sequential_code_idx" ON "suppliers"("sequential_code");

-- CreateIndex
CREATE INDEX "suppliers_is_active_idx" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "suppliers_rating_idx" ON "suppliers"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_deleted_at_key" ON "suppliers"("cnpj", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_code_key" ON "manufacturers"("code");

-- CreateIndex
CREATE INDEX "manufacturers_is_active_idx" ON "manufacturers"("is_active");

-- CreateIndex
CREATE INDEX "manufacturers_rating_idx" ON "manufacturers"("rating");

-- CreateIndex
CREATE INDEX "manufacturers_sequential_code_idx" ON "manufacturers"("sequential_code");

-- CreateIndex
CREATE INDEX "categories_parent_id_deleted_at_idx" ON "categories"("parent_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_deleted_at_key" ON "categories"("slug", "deleted_at");

-- CreateIndex
CREATE INDEX "warehouses_is_active_idx" ON "warehouses"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_deleted_at_key" ON "warehouses"("code", "deleted_at");

-- CreateIndex
CREATE INDEX "zones_warehouse_id_idx" ON "zones"("warehouse_id");

-- CreateIndex
CREATE INDEX "zones_is_active_idx" ON "zones"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "zones_warehouse_id_code_deleted_at_key" ON "zones"("warehouse_id", "code", "deleted_at");

-- CreateIndex
CREATE INDEX "bins_zone_id_idx" ON "bins"("zone_id");

-- CreateIndex
CREATE INDEX "bins_address_idx" ON "bins"("address");

-- CreateIndex
CREATE INDEX "bins_aisle_idx" ON "bins"("aisle");

-- CreateIndex
CREATE INDEX "bins_is_active_idx" ON "bins"("is_active");

-- CreateIndex
CREATE INDEX "bins_is_blocked_idx" ON "bins"("is_blocked");

-- CreateIndex
CREATE INDEX "bins_zone_id_aisle_shelf_idx" ON "bins"("zone_id", "aisle", "shelf");

-- CreateIndex
CREATE UNIQUE INDEX "bins_address_deleted_at_key" ON "bins"("address", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bins_zone_id_aisle_shelf_position_deleted_at_key" ON "bins"("zone_id", "aisle", "shelf", "position", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "volumes_code_key" ON "volumes"("code");

-- CreateIndex
CREATE INDEX "volumes_status_idx" ON "volumes"("status");

-- CreateIndex
CREATE INDEX "volumes_code_idx" ON "volumes"("code");

-- CreateIndex
CREATE INDEX "volumes_created_at_idx" ON "volumes"("created_at");

-- CreateIndex
CREATE INDEX "volumes_closed_at_idx" ON "volumes"("closed_at");

-- CreateIndex
CREATE INDEX "volumes_deleted_at_idx" ON "volumes"("deleted_at");

-- CreateIndex
CREATE INDEX "volume_items_volume_id_idx" ON "volume_items"("volume_id");

-- CreateIndex
CREATE INDEX "volume_items_item_id_idx" ON "volume_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "volume_items_volume_id_item_id_key" ON "volume_items"("volume_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "templates_code_key" ON "templates"("code");

-- CreateIndex
CREATE INDEX "templates_sequential_code_idx" ON "templates"("sequential_code");

-- CreateIndex
CREATE INDEX "templates_is_active_idx" ON "templates"("is_active");

-- CreateIndex
CREATE INDEX "templates_code_idx" ON "templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_deleted_at_key" ON "templates"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_full_code_key" ON "products"("full_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_ean_code_key" ON "products"("ean_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_upc_code_key" ON "products"("upc_code");

-- CreateIndex
CREATE INDEX "products_template_id_idx" ON "products"("template_id");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_manufacturer_id_idx" ON "products"("manufacturer_id");

-- CreateIndex
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_sequential_code_idx" ON "products"("sequential_code");

-- CreateIndex
CREATE INDEX "products_full_code_idx" ON "products"("full_code");

-- CreateIndex
CREATE INDEX "products_barcode_idx" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_ean_code_idx" ON "products"("ean_code");

-- CreateIndex
CREATE INDEX "products_upc_code_idx" ON "products"("upc_code");

-- CreateIndex
CREATE INDEX "products_slug_deleted_at_idx" ON "products"("slug", "deleted_at");

-- CreateIndex
CREATE INDEX "products_name_deleted_at_idx" ON "products"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_deleted_at_key" ON "products"("slug", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_slug_key" ON "variants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "variants_full_code_key" ON "variants"("full_code");

-- CreateIndex
CREATE UNIQUE INDEX "variants_barcode_key" ON "variants"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "variants_ean_code_key" ON "variants"("ean_code");

-- CreateIndex
CREATE UNIQUE INDEX "variants_upc_code_key" ON "variants"("upc_code");

-- CreateIndex
CREATE INDEX "variants_product_id_idx" ON "variants"("product_id");

-- CreateIndex
CREATE INDEX "variants_sequential_code_idx" ON "variants"("sequential_code");

-- CreateIndex
CREATE INDEX "variants_full_code_idx" ON "variants"("full_code");

-- CreateIndex
CREATE INDEX "variants_is_active_idx" ON "variants"("is_active");

-- CreateIndex
CREATE INDEX "variants_barcode_idx" ON "variants"("barcode");

-- CreateIndex
CREATE INDEX "variants_ean_code_idx" ON "variants"("ean_code");

-- CreateIndex
CREATE INDEX "variants_upc_code_idx" ON "variants"("upc_code");

-- CreateIndex
CREATE INDEX "variants_slug_deleted_at_idx" ON "variants"("slug", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_deleted_at_key" ON "variants"("sku", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_slug_deleted_at_key" ON "variants"("slug", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "items_slug_key" ON "items"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "items_full_code_key" ON "items"("full_code");

-- CreateIndex
CREATE UNIQUE INDEX "items_barcode_key" ON "items"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "items_ean_code_key" ON "items"("ean_code");

-- CreateIndex
CREATE UNIQUE INDEX "items_upc_code_key" ON "items"("upc_code");

-- CreateIndex
CREATE INDEX "items_variant_id_idx" ON "items"("variant_id");

-- CreateIndex
CREATE INDEX "items_bin_id_idx" ON "items"("bin_id");

-- CreateIndex
CREATE INDEX "items_sequential_code_idx" ON "items"("sequential_code");

-- CreateIndex
CREATE INDEX "items_full_code_idx" ON "items"("full_code");

-- CreateIndex
CREATE INDEX "items_batch_number_idx" ON "items"("batch_number");

-- CreateIndex
CREATE INDEX "items_expiry_date_idx" ON "items"("expiry_date");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "items_barcode_idx" ON "items"("barcode");

-- CreateIndex
CREATE INDEX "items_ean_code_idx" ON "items"("ean_code");

-- CreateIndex
CREATE INDEX "items_upc_code_idx" ON "items"("upc_code");

-- CreateIndex
CREATE INDEX "items_slug_deleted_at_idx" ON "items"("slug", "deleted_at");

-- CreateIndex
CREATE INDEX "items_variant_id_bin_id_idx" ON "items"("variant_id", "bin_id");

-- CreateIndex
CREATE INDEX "items_expiry_date_deleted_at_idx" ON "items"("expiry_date", "deleted_at");

-- CreateIndex
CREATE INDEX "items_batch_number_variant_id_idx" ON "items"("batch_number", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_unique_code_deleted_at_key" ON "items"("unique_code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "items_slug_deleted_at_key" ON "items"("slug", "deleted_at");

-- CreateIndex
CREATE INDEX "item_movements_item_id_idx" ON "item_movements"("item_id");

-- CreateIndex
CREATE INDEX "item_movements_user_id_idx" ON "item_movements"("user_id");

-- CreateIndex
CREATE INDEX "item_movements_approved_by_idx" ON "item_movements"("approved_by");

-- CreateIndex
CREATE INDEX "item_movements_movement_type_idx" ON "item_movements"("movement_type");

-- CreateIndex
CREATE INDEX "item_movements_batch_number_idx" ON "item_movements"("batch_number");

-- CreateIndex
CREATE INDEX "item_movements_sales_order_id_idx" ON "item_movements"("sales_order_id");

-- CreateIndex
CREATE INDEX "item_movements_item_id_created_at_idx" ON "item_movements"("item_id", "created_at");

-- CreateIndex
CREATE INDEX "item_movements_user_id_movement_type_idx" ON "item_movements"("user_id", "movement_type");

-- CreateIndex
CREATE INDEX "item_movements_created_at_idx" ON "item_movements"("created_at" DESC);

-- CreateIndex
CREATE INDEX "product_categories_product_id_idx" ON "product_categories"("product_id");

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "product_categories"("category_id");

-- CreateIndex
CREATE INDEX "product_categories_featured_idx" ON "product_categories"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_product_id_category_id_key" ON "product_categories"("product_id", "category_id");

-- CreateIndex
CREATE INDEX "variant_price_history_variant_id_idx" ON "variant_price_history"("variant_id");

-- CreateIndex
CREATE INDEX "variant_price_history_user_id_idx" ON "variant_price_history"("user_id");

-- CreateIndex
CREATE INDEX "variant_price_history_created_at_idx" ON "variant_price_history"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_affected_user_idx" ON "audit_logs"("affected_user");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_expires_at_idx" ON "audit_logs"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_module_created_at_idx" ON "audit_logs"("module", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_action_idx" ON "audit_logs"("user_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "product_tags_product_id_idx" ON "product_tags"("product_id");

-- CreateIndex
CREATE INDEX "product_tags_tag_id_idx" ON "product_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_tags_product_id_tag_id_key" ON "product_tags"("product_id", "tag_id");

-- CreateIndex
CREATE INDEX "variant_images_variant_id_idx" ON "variant_images"("variant_id");

-- CreateIndex
CREATE INDEX "variant_images_is_primary_idx" ON "variant_images"("is_primary");

-- CreateIndex
CREATE INDEX "variant_images_variant_id_order_idx" ON "variant_images"("variant_id", "order");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_is_read_idx" ON "alerts"("is_read");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_entity_id_idx" ON "alerts"("entity_id");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_user_id_is_read_idx" ON "alerts"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "alerts_user_id_severity_is_read_idx" ON "alerts"("user_id", "severity", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_number_key" ON "purchase_orders"("order_number");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_order_number_idx" ON "purchase_orders"("order_number");

-- CreateIndex
CREATE INDEX "purchase_orders_expected_date_idx" ON "purchase_orders"("expected_date");

-- CreateIndex
CREATE INDEX "purchase_orders_created_by_idx" ON "purchase_orders"("created_by");

-- CreateIndex
CREATE INDEX "purchase_order_items_order_id_idx" ON "purchase_order_items"("order_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_variant_id_idx" ON "purchase_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "unit_conversions_variant_id_idx" ON "unit_conversions"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_conversions_variant_id_fromUnit_toUnit_key" ON "unit_conversions"("variant_id", "fromUnit", "toUnit");

-- CreateIndex
CREATE INDEX "stock_snapshots_variant_id_idx" ON "stock_snapshots"("variant_id");

-- CreateIndex
CREATE INDEX "stock_snapshots_bin_id_idx" ON "stock_snapshots"("bin_id");

-- CreateIndex
CREATE INDEX "stock_snapshots_snapshot_date_idx" ON "stock_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "stock_snapshots_variant_id_snapshot_date_idx" ON "stock_snapshots"("variant_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "customers_document_idx" ON "customers"("document");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_is_active_idx" ON "customers"("is_active");

-- CreateIndex
CREATE INDEX "customers_type_idx" ON "customers"("type");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_deleted_at_key" ON "customers"("document", "deleted_at");

-- CreateIndex
CREATE INDEX "sales_orders_customer_id_idx" ON "sales_orders"("customer_id");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "sales_orders"("status");

-- CreateIndex
CREATE INDEX "sales_orders_order_number_idx" ON "sales_orders"("order_number");

-- CreateIndex
CREATE INDEX "sales_orders_created_by_idx" ON "sales_orders"("created_by");

-- CreateIndex
CREATE INDEX "sales_orders_created_at_idx" ON "sales_orders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_number_deleted_at_key" ON "sales_orders"("order_number", "deleted_at");

-- CreateIndex
CREATE INDEX "sales_order_items_order_id_idx" ON "sales_order_items"("order_id");

-- CreateIndex
CREATE INDEX "sales_order_items_variant_id_idx" ON "sales_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "item_reservations_item_id_idx" ON "item_reservations"("item_id");

-- CreateIndex
CREATE INDEX "item_reservations_user_id_idx" ON "item_reservations"("user_id");

-- CreateIndex
CREATE INDEX "item_reservations_expires_at_idx" ON "item_reservations"("expires_at");

-- CreateIndex
CREATE INDEX "item_reservations_item_id_expires_at_idx" ON "item_reservations"("item_id", "expires_at");

-- CreateIndex
CREATE INDEX "variant_supplier_codes_variant_id_idx" ON "variant_supplier_codes"("variant_id");

-- CreateIndex
CREATE INDEX "variant_supplier_codes_supplier_id_idx" ON "variant_supplier_codes"("supplier_id");

-- CreateIndex
CREATE INDEX "variant_supplier_codes_code_idx" ON "variant_supplier_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "variant_supplier_codes_variant_id_supplier_id_key" ON "variant_supplier_codes"("variant_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_supplier_codes_supplier_id_code_key" ON "variant_supplier_codes"("supplier_id", "code");

-- CreateIndex
CREATE INDEX "variant_promotions_variant_id_idx" ON "variant_promotions"("variant_id");

-- CreateIndex
CREATE INDEX "variant_promotions_is_active_idx" ON "variant_promotions"("is_active");

-- CreateIndex
CREATE INDEX "variant_promotions_start_date_end_date_idx" ON "variant_promotions"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "variant_promotions_variant_id_start_date_end_date_idx" ON "variant_promotions"("variant_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_entityType_entityId_idx" ON "comments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "comments_parent_comment_id_idx" ON "comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_alert_type_idx" ON "notification_preferences"("alert_type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_alert_type_channel_key" ON "notification_preferences"("user_id", "alert_type", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_code_key" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_code_idx" ON "notification_templates"("code");

-- CreateIndex
CREATE INDEX "notification_templates_is_active_idx" ON "notification_templates"("is_active");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_priority_idx" ON "notifications"("priority");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "notifications"("channel");

-- CreateIndex
CREATE INDEX "notifications_entity_type_entity_id_idx" ON "notifications"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications"("scheduled_for");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "requests_approval_id_key" ON "requests"("approval_id");

-- CreateIndex
CREATE INDEX "requests_requester_id_idx" ON "requests"("requester_id");

-- CreateIndex
CREATE INDEX "requests_assigned_to_id_idx" ON "requests"("assigned_to_id");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_type_category_idx" ON "requests"("type", "category");

-- CreateIndex
CREATE INDEX "requests_due_date_idx" ON "requests"("due_date");

-- CreateIndex
CREATE INDEX "requests_created_at_idx" ON "requests"("created_at");

-- CreateIndex
CREATE INDEX "request_attachments_request_id_idx" ON "request_attachments"("request_id");

-- CreateIndex
CREATE INDEX "request_comments_request_id_idx" ON "request_comments"("request_id");

-- CreateIndex
CREATE INDEX "request_comments_author_id_idx" ON "request_comments"("author_id");

-- CreateIndex
CREATE INDEX "request_history_request_id_idx" ON "request_history"("request_id");

-- CreateIndex
CREATE INDEX "request_history_created_at_idx" ON "request_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_user_id_idx" ON "employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_cpf_idx" ON "employees"("cpf");

-- CreateIndex
CREATE INDEX "employees_registration_number_idx" ON "employees"("registration_number");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_position_id_idx" ON "employees"("position_id");

-- CreateIndex
CREATE INDEX "employees_supervisor_id_idx" ON "employees"("supervisor_id");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_hire_date_idx" ON "employees"("hire_date");

-- CreateIndex
CREATE INDEX "employees_termination_date_idx" ON "employees"("termination_date");

-- CreateIndex
CREATE INDEX "employees_deleted_at_idx" ON "employees"("deleted_at");

-- CreateIndex
CREATE INDEX "employees_organization_id_idx" ON "employees"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_registration_number_deleted_at_key" ON "employees"("registration_number", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_deleted_at_key" ON "employees"("cpf", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_pis_deleted_at_key" ON "employees"("pis", "deleted_at");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "departments"("code");

-- CreateIndex
CREATE INDEX "departments_parent_id_idx" ON "departments"("parent_id");

-- CreateIndex
CREATE INDEX "departments_manager_id_idx" ON "departments"("manager_id");

-- CreateIndex
CREATE INDEX "departments_company_id_idx" ON "departments"("company_id");

-- CreateIndex
CREATE INDEX "departments_is_active_idx" ON "departments"("is_active");

-- CreateIndex
CREATE INDEX "departments_deleted_at_idx" ON "departments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_company_id_deleted_at_key" ON "departments"("code", "company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "positions_code_key" ON "positions"("code");

-- CreateIndex
CREATE INDEX "positions_code_idx" ON "positions"("code");

-- CreateIndex
CREATE INDEX "positions_department_id_idx" ON "positions"("department_id");

-- CreateIndex
CREATE INDEX "positions_level_idx" ON "positions"("level");

-- CreateIndex
CREATE INDEX "positions_is_active_idx" ON "positions"("is_active");

-- CreateIndex
CREATE INDEX "positions_deleted_at_idx" ON "positions"("deleted_at");

-- CreateIndex
CREATE INDEX "time_entries_employee_id_idx" ON "time_entries"("employee_id");

-- CreateIndex
CREATE INDEX "time_entries_timestamp_idx" ON "time_entries"("timestamp");

-- CreateIndex
CREATE INDEX "time_entries_entry_type_idx" ON "time_entries"("entry_type");

-- CreateIndex
CREATE INDEX "time_entries_employee_id_timestamp_idx" ON "time_entries"("employee_id", "timestamp");

-- CreateIndex
CREATE INDEX "overtime_employee_id_idx" ON "overtime"("employee_id");

-- CreateIndex
CREATE INDEX "overtime_date_idx" ON "overtime"("date");

-- CreateIndex
CREATE INDEX "overtime_approved_idx" ON "overtime"("approved");

-- CreateIndex
CREATE INDEX "time_banks_employee_id_idx" ON "time_banks"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_banks_employee_id_year_key" ON "time_banks"("employee_id", "year");

-- CreateIndex
CREATE INDEX "absences_employee_id_idx" ON "absences"("employee_id");

-- CreateIndex
CREATE INDEX "absences_type_idx" ON "absences"("type");

-- CreateIndex
CREATE INDEX "absences_status_idx" ON "absences"("status");

-- CreateIndex
CREATE INDEX "absences_start_date_end_date_idx" ON "absences"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "absences_vacation_period_id_idx" ON "absences"("vacation_period_id");

-- CreateIndex
CREATE INDEX "absences_deleted_at_idx" ON "absences"("deleted_at");

-- CreateIndex
CREATE INDEX "vacation_periods_employee_id_idx" ON "vacation_periods"("employee_id");

-- CreateIndex
CREATE INDEX "vacation_periods_status_idx" ON "vacation_periods"("status");

-- CreateIndex
CREATE INDEX "vacation_periods_acquisition_start_acquisition_end_idx" ON "vacation_periods"("acquisition_start", "acquisition_end");

-- CreateIndex
CREATE INDEX "vacation_periods_concession_start_concession_end_idx" ON "vacation_periods"("concession_start", "concession_end");

-- CreateIndex
CREATE INDEX "vacation_periods_deleted_at_idx" ON "vacation_periods"("deleted_at");

-- CreateIndex
CREATE INDEX "payrolls_status_idx" ON "payrolls"("status");

-- CreateIndex
CREATE INDEX "payrolls_reference_year_reference_month_idx" ON "payrolls"("reference_year", "reference_month");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_reference_month_reference_year_key" ON "payrolls"("reference_month", "reference_year");

-- CreateIndex
CREATE INDEX "payroll_items_payroll_id_idx" ON "payroll_items"("payroll_id");

-- CreateIndex
CREATE INDEX "payroll_items_employee_id_idx" ON "payroll_items"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_items_type_idx" ON "payroll_items"("type");

-- CreateIndex
CREATE INDEX "bonuses_employee_id_idx" ON "bonuses"("employee_id");

-- CreateIndex
CREATE INDEX "bonuses_date_idx" ON "bonuses"("date");

-- CreateIndex
CREATE INDEX "bonuses_is_paid_idx" ON "bonuses"("is_paid");

-- CreateIndex
CREATE INDEX "deductions_employee_id_idx" ON "deductions"("employee_id");

-- CreateIndex
CREATE INDEX "deductions_date_idx" ON "deductions"("date");

-- CreateIndex
CREATE INDEX "deductions_is_applied_idx" ON "deductions"("is_applied");

-- CreateIndex
CREATE INDEX "deductions_is_recurring_idx" ON "deductions"("is_recurring");

-- CreateIndex
CREATE INDEX "companies_cnpj_idx" ON "companies"("cnpj");

-- CreateIndex
CREATE INDEX "companies_legal_name_idx" ON "companies"("legal_name");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- CreateIndex
CREATE INDEX "companies_created_at_idx" ON "companies"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_deleted_at_key" ON "companies"("cnpj", "deleted_at");

-- CreateIndex
CREATE INDEX "company_addresses_company_id_idx" ON "company_addresses"("company_id");

-- CreateIndex
CREATE INDEX "company_addresses_type_idx" ON "company_addresses"("type");

-- CreateIndex
CREATE INDEX "company_addresses_zip_idx" ON "company_addresses"("zip");

-- CreateIndex
CREATE INDEX "company_addresses_is_primary_idx" ON "company_addresses"("is_primary");

-- CreateIndex
CREATE INDEX "company_addresses_deleted_at_idx" ON "company_addresses"("deleted_at");

-- CreateIndex
CREATE INDEX "company_addresses_created_at_idx" ON "company_addresses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_addresses_company_id_type_deleted_at_key" ON "company_addresses"("company_id", "type", "deleted_at");

-- CreateIndex
CREATE INDEX "company_cnaes_company_id_idx" ON "company_cnaes"("company_id");

-- CreateIndex
CREATE INDEX "company_cnaes_code_idx" ON "company_cnaes"("code");

-- CreateIndex
CREATE INDEX "company_cnaes_is_primary_idx" ON "company_cnaes"("is_primary");

-- CreateIndex
CREATE INDEX "company_cnaes_status_idx" ON "company_cnaes"("status");

-- CreateIndex
CREATE INDEX "company_cnaes_deleted_at_idx" ON "company_cnaes"("deleted_at");

-- CreateIndex
CREATE INDEX "company_cnaes_created_at_idx" ON "company_cnaes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_cnaes_company_id_code_deleted_at_key" ON "company_cnaes"("company_id", "code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_fiscal_settings_company_id_key" ON "company_fiscal_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_company_id_idx" ON "company_fiscal_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_digital_certificate_type_idx" ON "company_fiscal_settings"("digital_certificate_type");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_nfe_environment_idx" ON "company_fiscal_settings"("nfe_environment");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_nfce_enabled_idx" ON "company_fiscal_settings"("nfce_enabled");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_deleted_at_idx" ON "company_fiscal_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_created_at_idx" ON "company_fiscal_settings"("created_at");

-- CreateIndex
CREATE INDEX "company_stakeholders_company_id_idx" ON "company_stakeholders"("company_id");

-- CreateIndex
CREATE INDEX "company_stakeholders_role_idx" ON "company_stakeholders"("role");

-- CreateIndex
CREATE INDEX "company_stakeholders_status_idx" ON "company_stakeholders"("status");

-- CreateIndex
CREATE INDEX "company_stakeholders_is_legal_representative_idx" ON "company_stakeholders"("is_legal_representative");

-- CreateIndex
CREATE INDEX "company_stakeholders_source_idx" ON "company_stakeholders"("source");

-- CreateIndex
CREATE INDEX "company_stakeholders_deleted_at_idx" ON "company_stakeholders"("deleted_at");

-- CreateIndex
CREATE INDEX "company_stakeholders_created_at_idx" ON "company_stakeholders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_stakeholders_company_id_name_role_deleted_at_key" ON "company_stakeholders"("company_id", "name", "role", "deleted_at");

-- CreateIndex
CREATE INDEX "label_templates_organization_id_idx" ON "label_templates"("organization_id");

-- CreateIndex
CREATE INDEX "label_templates_is_system_idx" ON "label_templates"("is_system");

-- CreateIndex
CREATE INDEX "label_templates_created_by_id_idx" ON "label_templates"("created_by_id");

-- CreateIndex
CREATE INDEX "label_templates_deleted_at_idx" ON "label_templates"("deleted_at");

-- CreateIndex
CREATE INDEX "label_templates_created_at_idx" ON "label_templates"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "label_templates_organization_id_name_deleted_at_key" ON "label_templates"("organization_id", "name", "deleted_at");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "permission_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_group_permissions" ADD CONSTRAINT "permission_group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_group_permissions" ADD CONSTRAINT "permission_group_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permission_groups" ADD CONSTRAINT "user_permission_groups_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_direct_permissions" ADD CONSTRAINT "user_direct_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_direct_permissions" ADD CONSTRAINT "user_direct_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_direct_permissions" ADD CONSTRAINT "user_direct_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_addresses" ADD CONSTRAINT "organization_addresses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_cnaes" ADD CONSTRAINT "organization_cnaes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_fiscal_settings" ADD CONSTRAINT "organization_fiscal_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_stakeholders" ADD CONSTRAINT "organization_stakeholders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bins" ADD CONSTRAINT "bins_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_delivered_by_fkey" FOREIGN KEY ("delivered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_items" ADD CONSTRAINT "volume_items_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "volumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_items" ADD CONSTRAINT "volume_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_movements" ADD CONSTRAINT "item_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_movements" ADD CONSTRAINT "item_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_movements" ADD CONSTRAINT "item_movements_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_movements" ADD CONSTRAINT "item_movements_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_price_history" ADD CONSTRAINT "variant_price_history_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_price_history" ADD CONSTRAINT "variant_price_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_images" ADD CONSTRAINT "variant_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_conversions" ADD CONSTRAINT "unit_conversions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_reservations" ADD CONSTRAINT "item_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_reservations" ADD CONSTRAINT "item_reservations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_supplier_codes" ADD CONSTRAINT "variant_supplier_codes_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_supplier_codes" ADD CONSTRAINT "variant_supplier_codes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_promotions" ADD CONSTRAINT "variant_promotions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_comments" ADD CONSTRAINT "request_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_history" ADD CONSTRAINT "request_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_history" ADD CONSTRAINT "request_history_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime" ADD CONSTRAINT "overtime_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "overtime" ADD CONSTRAINT "overtime_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_banks" ADD CONSTRAINT "time_banks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vacation_periods" ADD CONSTRAINT "vacation_periods_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_cnaes" ADD CONSTRAINT "company_cnaes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_fiscal_settings" ADD CONSTRAINT "company_fiscal_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_stakeholders" ADD CONSTRAINT "company_stakeholders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_templates" ADD CONSTRAINT "label_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "label_templates" ADD CONSTRAINT "label_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
