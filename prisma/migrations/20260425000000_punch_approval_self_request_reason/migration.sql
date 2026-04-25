-- Phase 08 / Plan 08-01 — Schema alignment for PWA self-create PunchApproval.
--
-- The endpoint POST /v1/hr/punch-approvals (D-07/D-08) lets the employee
-- themselves open a justification request from the personal PWA (e.g. forgot
-- to clock-in, attaching a medical attestation). To avoid overloading the
-- existing reasons (OUT_OF_GEOFENCE / FACE_MATCH_LOW which are kiosk-driven),
-- we add a dedicated value EMPLOYEE_SELF_REQUEST.
--
-- Applied via Plan 04-01 workaround:
--   npx prisma db execute --file <this file> && npx prisma migrate resolve --applied
--
-- Rationale: production / dev databases carry pre-existing drift in unrelated
-- modules (notifications v2, finance, items) that blocks `prisma migrate dev`.
-- Hand-curated SQL keeps the change scoped to this single enum addition.

ALTER TYPE "PunchApprovalReason" ADD VALUE IF NOT EXISTS 'EMPLOYEE_SELF_REQUEST';

-- Phase 8 / Plan 08-01 (D-07): time_entry_id passa a ser opcional. No cenário
-- "funcionário pede registro de batida ausente" não há TimeEntry física até
-- o gestor aprovar com correctionPayload (lifecycle Phase 6-02). FK preservada
-- com ON DELETE CASCADE — quando a TimeEntry existe, deletá-la cascade na
-- aprovação. Quando NULL, aprovação carrega proposedTimestamp em `details`.
ALTER TABLE "punch_approvals" ALTER COLUMN "time_entry_id" DROP NOT NULL;

-- ─── Rollback (commented — Postgres does NOT support DROP VALUE on enum
--     without rebuilding the entire enum + every dependent column). For
--     emergency reversion: recreate `PunchApprovalReason` as a new enum
--     minus EMPLOYEE_SELF_REQUEST, ALTER TABLE punch_approvals USING
--     new_enum::text::old_enum, DROP TYPE old, RENAME new → old.
-- ─────────────────────────────────────────────────────────────────────────
