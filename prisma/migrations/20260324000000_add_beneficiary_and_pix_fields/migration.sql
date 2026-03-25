-- AlterTable
ALTER TABLE "finance_entries" ADD COLUMN "beneficiary_name" VARCHAR(512);
ALTER TABLE "finance_entries" ADD COLUMN "beneficiary_cpf_cnpj" VARCHAR(20);
ALTER TABLE "finance_entries" ADD COLUMN "pix_key" VARCHAR(256);
ALTER TABLE "finance_entries" ADD COLUMN "pix_key_type" VARCHAR(16);
