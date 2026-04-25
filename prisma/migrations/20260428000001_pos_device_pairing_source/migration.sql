-- New enum tracking how a PosDevicePairing was created:
--  - JWT    → admin paired through an authenticated route
--  - PUBLIC → Emporion fresh-install paired via /v1/pos/devices/pair-public
-- See ADR 030 for the security rationale.

CREATE TYPE "PosPairingSource" AS ENUM ('JWT', 'PUBLIC');

-- Existing rows pre-date the public pair endpoint, so backfill them as JWT.
ALTER TABLE "pos_device_pairings"
  ADD COLUMN "pairing_source" "PosPairingSource" NOT NULL DEFAULT 'JWT';
