-- Adiciona coluna totp_secret ao User. Default vazio para permitir
-- ALTER TABLE instantâneo; backfill imediato para usuários existentes.
ALTER TABLE "users" ADD COLUMN "totp_secret" VARCHAR(64) NOT NULL DEFAULT '';

-- Backfill: gera 32 bytes aleatórios em hex (= 64 chars) para cada
-- usuário que ainda está com o default vazio. Usa pgcrypto/gen_random_bytes
-- se disponível; caso contrário, cai para md5(random()||clock_timestamp()).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    UPDATE "users"
       SET "totp_secret" = encode(gen_random_bytes(32), 'hex')
     WHERE "totp_secret" = '';
  ELSE
    UPDATE "users"
       SET "totp_secret" = md5(random()::text || clock_timestamp()::text) ||
                            md5(random()::text || clock_timestamp()::text)
     WHERE "totp_secret" = '';
  END IF;
END $$;
