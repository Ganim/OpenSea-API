-- AddCareInstructionIdsToProduct
-- Adds care_instruction_ids array column to products table

ALTER TABLE "products" ADD COLUMN "care_instruction_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
