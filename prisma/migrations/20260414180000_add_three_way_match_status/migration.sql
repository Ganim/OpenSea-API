-- Add three-way match status fields to finance_entries
ALTER TABLE "finance_entries"
  ADD COLUMN "three_way_match_status" VARCHAR(20),
  ADD COLUMN "three_way_matched_at" TIMESTAMP(3);
