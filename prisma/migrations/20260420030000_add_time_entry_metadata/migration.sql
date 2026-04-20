-- Phase 5 / Plan 05-07 — kiosk punch pipeline integration
--
-- Adds TimeEntry.metadata (JSONB, nullable) for kiosk-side signals that
-- must be persisted for audit without feeding into Phase 5 gating logic.
-- Current payload is { liveness: { blinkDetected, trackingFrames, durationMs } }
-- per D-04; Phase 9 antifraude consumers may derive policy from this
-- accumulated data later.
--
-- Additive-only, nullable — every existing row and every pre-Phase-5
-- path continues to function without migration-driven backfill.

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN "metadata" JSONB;
