-- Add appVersion column to pos_device_pairings.
-- Reported by the Emporion desktop client on heartbeat so the admin UI
-- can surface installed-version badges and detect outdated devices.
ALTER TABLE "pos_device_pairings"
  ADD COLUMN "app_version" VARCHAR(32);
