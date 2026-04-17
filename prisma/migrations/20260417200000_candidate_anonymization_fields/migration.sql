-- HR P0 (Recruitment — LGPD anonymization of Candidate PII)
--
-- When a candidate is explicitly rejected in a "final" state (or soft-deleted
-- via the SAR/right-to-erasure flow in LGPD Art. 18 VI) we MUST scrub every
-- identifying field — name, email, CPF, phone, address, resume, LinkedIn —
-- while keeping the aggregated analytics information (stage reached,
-- application count, source channel, createdAt) so that recruitment funnel
-- metrics are not corrupted.
--
-- The columns added below trace the event (when and by whom) so the audit
-- log can surface it and any future DPO audit can prove compliance. The
-- accompanying index keeps the "list anonymized candidates in the last X
-- days" query cheap.

ALTER TABLE "candidates"
  ADD COLUMN "anonymized_at" TIMESTAMP(3),
  ADD COLUMN "anonymized_by" TEXT;

CREATE INDEX "candidates_anonymized_at_idx"
  ON "candidates" ("anonymized_at");
