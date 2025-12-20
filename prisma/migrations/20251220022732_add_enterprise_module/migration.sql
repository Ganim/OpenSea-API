-- CreateTable
CREATE TABLE "enterprises" (
    "id" TEXT NOT NULL,
    "legal_name" VARCHAR(256) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "tax_regime" VARCHAR(128),
    "phone" VARCHAR(20),
    "address" VARCHAR(256),
    "address_number" VARCHAR(16),
    "complement" VARCHAR(128),
    "neighborhood" VARCHAR(128),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(64) DEFAULT 'Brasil',
    "logo_url" VARCHAR(512),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enterprises_cnpj_idx" ON "enterprises"("cnpj");

-- CreateIndex
CREATE INDEX "enterprises_legal_name_idx" ON "enterprises"("legal_name");

-- CreateIndex
CREATE INDEX "enterprises_deleted_at_idx" ON "enterprises"("deleted_at");

-- CreateIndex
CREATE INDEX "enterprises_created_at_idx" ON "enterprises"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "enterprises_cnpj_deleted_at_key" ON "enterprises"("cnpj", "deleted_at");
