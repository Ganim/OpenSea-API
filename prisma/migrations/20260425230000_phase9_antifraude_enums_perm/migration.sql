-- Phase 09 / Plan 09-01 — Antifraude foundation
--
-- Adds enum values FACE_MATCH_FAIL_3X (D-10) and GPS_INCONSISTENT (D-02/D-04) to PunchApprovalReason.
-- Inserts permission row 'hr.punch.audit.access' (D-28, 4-level RBAC outside tools — ADR-031).
--
-- Applied via Plan 04-01/06-01/07-01 workaround:
--   npx prisma db execute --file prisma/migrations/20260425230000_phase9_antifraude_enums_perm/migration.sql --schema prisma/schema.prisma
--   npx prisma migrate resolve --applied 20260425230000_phase9_antifraude_enums_perm
--   npx prisma generate
--
-- Rationale: dev/prod databases carry pre-existing drift in unrelated modules
-- (notifications v2, finance, items, hr_contracts) that blocks `prisma migrate dev`.
-- Hand-curated SQL keeps the change scoped to this single feature.

ALTER TYPE "PunchApprovalReason" ADD VALUE IF NOT EXISTS 'GPS_INCONSISTENT';
ALTER TYPE "PunchApprovalReason" ADD VALUE IF NOT EXISTS 'FACE_MATCH_FAIL_3X';

-- Permission row (idempotent — backfill script registers in groups separately).
-- Tabela 'permissions' (snake_case via @@map) inclui colunas:
--   code, name, description, module, resource, action, is_system, metadata,
--   created_at, updated_at.
-- O backfill (prisma/backfill-phase9-permissions.ts) reusa esta linha via findMany,
-- mas insert direto aqui assegura presença da row mesmo se o backfill ainda não rodou.
INSERT INTO "permissions" (
  "id",
  "code",
  "name",
  "description",
  "module",
  "resource",
  "action",
  "is_system",
  "metadata",
  "created_at",
  "updated_at"
)
VALUES (
  gen_random_uuid()::text,
  'hr.punch.audit.access',
  'Acessar Auditoria de Ponto',
  'Investigar batidas suspeitas com filtros antifraude e ferramentas forenses (LGPD: legitimate interest documented in ADR-031).',
  'hr',
  'punch.audit',
  'access',
  TRUE,
  '{}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT ("code") DO NOTHING;

-- ─── Rollback (commented — Postgres does NOT support DROP VALUE on enum
--     without rebuilding the entire enum + every dependent column).
--     For emergency reversion: recreate `PunchApprovalReason` as a new
--     enum minus FACE_MATCH_FAIL_3X and GPS_INCONSISTENT, ALTER TABLE
--     punch_approvals USING new_enum::text::old_enum, DROP TYPE old,
--     RENAME new → old.
--     Permission row removal: DELETE FROM "permissions" WHERE "code" = 'hr.punch.audit.access';
-- ─────────────────────────────────────────────────────────────────────────
