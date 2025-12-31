-- CreateEnum
CREATE TYPE "CompanyStakeholderRole" AS ENUM ('SOCIO', 'ADMINISTRADOR', 'PROCURADOR', 'REPRESENTANTE_LEGAL', 'GERENTE', 'DIRETOR', 'OUTRO');

-- CreateEnum
CREATE TYPE "CompanyStakeholderStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CompanyStakeholderSource" AS ENUM ('CNPJ_API', 'MANUAL');

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

-- AddForeignKey
ALTER TABLE "company_stakeholders" ADD CONSTRAINT "company_stakeholders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "enterprises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
