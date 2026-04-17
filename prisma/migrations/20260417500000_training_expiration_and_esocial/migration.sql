-- HR P0 (Training expiration + S-2240 draft auto-enqueue)
--
-- Background: completing a mandatory safety training (NR-10, NR-35 etc.)
-- must trigger an S-2240 (Condições Ambientais do Trabalho) record inside
-- eSocial within 30 days. We used to rely on humans remembering to fire the
-- event, which silently broke for many tenants. This migration adds two
-- pieces the use case needs:
--
--   1. training_programs.is_mandatory_for_esocial — marks which programs
--      must auto-generate S-2240 on completion. Defaults to false so
--      non-safety trainings (onboarding, leadership etc.) are untouched.
--   2. training_enrollments.expiration_date — set when the enrollment is
--      completed, derived from program.validity_months (defaulting to 24
--      months when the program leaves validity unset). The cron
--      `check-training-expiry` uses this column to alert 30 days ahead and
--      to notify "re-inscrição necessária" after expiry. Re-enrollment is
--      NOT auto-created — retraining is a manager decision, not an
--      automated write.
--
-- Retraining auto-creation intentionally deferred.

ALTER TABLE "training_programs"
  ADD COLUMN "is_mandatory_for_esocial" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "training_enrollments"
  ADD COLUMN "expiration_date" TIMESTAMP(3);

-- Supports the daily cron scan "expirations within 30 days AND expired
-- enrollments that need re-inscrição reminders". Without this index the
-- cron would table-scan every TrainingEnrollment at tenant scale.
CREATE INDEX "training_enrollments_tenant_id_expiration_date_idx"
  ON "training_enrollments" ("tenant_id", "expiration_date");
