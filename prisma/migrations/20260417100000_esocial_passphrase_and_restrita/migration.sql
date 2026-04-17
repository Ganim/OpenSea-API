-- Persist PFX passphrase (AES-256-GCM) so SOAP transmission can actually
-- sign with ICP-Brasil A1 certificates (resolves P0-04).
ALTER TABLE "esocial_certificates"
  ADD COLUMN "encrypted_passphrase" BYTEA,
  ADD COLUMN "passphrase_iv"        VARCHAR(64),
  ADD COLUMN "passphrase_tag"       VARCHAR(64);

-- Add the "produção restrita" environment as a distinct option so the real
-- PRODUCAO value can point to the legally-binding URL
-- (resolves P0-05: PRODUCAO was mapped to producaorestrita by mistake).
ALTER TYPE "EsocialEnvironment" ADD VALUE IF NOT EXISTS 'PRODUCAO_RESTRITA';
