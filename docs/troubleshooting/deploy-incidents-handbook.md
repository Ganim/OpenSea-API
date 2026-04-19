# Deploy Incidents Handbook

**Contexto:** lições aprendidas do deploy 2026-04-17 (225 API + 232 APP commits, 17 migrations, 3 incidentes em runtime). Este doc existe pra **evitar** esses 3 problemas em deploys futuros e servir de checklist.

---

## Incidente 1 — Migração órfã

**Sintoma:** `release_command` falha numa migration com erro tipo "relation X does not exist".

**Caso real (2026-04-17):** migration `20260417700000_generated_contracts_signature_envelope` tentou `ALTER TABLE hr_generated_employment_contracts ADD COLUMN ...` e a tabela **não existia em prod** — havia sido criada em local via `prisma db push` e nunca virou migration file.

### Fix

1. Criar migration manual que faz `CREATE TABLE IF NOT EXISTS` da tabela faltante (idempotente).
2. Usar FKs em `DO $$ BEGIN ... EXCEPTION ... END $$` (idempotente).
3. Deletar a row da migration falhada de `_prisma_migrations`:
   ```bash
   docker run --rm postgres:17 psql "<DATABASE_URL>" -c "DELETE FROM _prisma_migrations WHERE migration_name = 'X';"
   ```
4. Rodar `prisma migrate deploy` de novo.

### Como prevenir

- **Nunca usar `prisma db push` em prod** (apenas local rápido). Sempre gerar migration file via `prisma migrate dev`.
- **Auditoria schema vs migrations antes do deploy:**
  ```bash
  grep "@@map" schema.prisma | while read line; do
    table=$(echo $line | awk -F'"' '{print $2}')
    grep -rq "CREATE TABLE.*$table" prisma/migrations/ || echo "MISSING: $table"
  done
  ```
- Idealmente um **CI check** que falha se houver tabela no schema sem `CREATE TABLE` em alguma migration.

---

## Incidente 2 — `grace_period` insuficiente no Fly

**Sintoma:** machine boota rápido (~10s) mas Fly mata antes do health check passar. No boot **inicial** após migration grande, pode levar >120s para a API ficar reachable via proxy (cold start + plugin registration + Prisma client regen).

**Caso real (2026-04-17):** grace_period estava em 120s. Primeira tentativa pós-migrations demorou 155s. Fly matou a machine, deploy rollback.

### Fix

Bumpar `grace_period` no `fly.toml`:

```toml
[[http_service.checks]]
  grace_period = "300s"  # era "120s"
  interval = "15s"
  method = "GET"
  path = "/health/live"
```

### Como prevenir

- `grace_period = "300s"` é o default recomendado do projeto (já aplicado em `OpenSea-API/fly.toml`).
- Deploys de APP são mais rápidos (~30s), mas não diminuir abaixo de 60s.
- Em boots subsequentes a API levanta em ~10s, então 300s é folgado — seguro.

---

## Incidente 3 — `isDirectRun` idiom em bundle tsup/esbuild

**Sintoma (mais crítico):** machine sobe, registra BullMQ workers, emite "Server ready" — e **1 segundo depois** sai com `code: 0` (exit normal, não crash). Loop infinito de restart.

**Caso real (2026-04-17):** arquivos `src/jobs/signature/expire-envelopes.ts` e `src/jobs/signature/remind-pending-signers.ts` tinham bloco "run como standalone":

```ts
const isDirectRun =
  typeof process.argv[1] === 'string' &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  expireSignatureEnvelopes().then(() => process.exit(0));
}
```

**Causa:** `tsup` bundla TUDO em `build/server.js`. Em módulo bundled, `import.meta.url === "file:///app/build/server.js"` e `process.argv[1] === "/app/build/server.js"` → `isDirectRun === true` → o job standalone dispara logo após o server subir → `process.exit(0)` mata o processo.

### Fix (commit `9d6d3d09`)

Gate o bloco standalone com env var explícito:

```ts
if (process.env.STANDALONE_CRON === 'true') {
  expireSignatureEnvelopes().then(() => process.exit(0));
}
```

### Como prevenir

**NUNCA** use `import.meta.url === process.argv[1]` em projetos com bundling tsup/esbuild. Sempre use env-var gate explícito:

```ts
// ❌ QUEBRA EM BUNDLE
const isDirectRun = fileURLToPath(import.meta.url) === process.argv[1];

// ✅ EXPLÍCITO
const isDirectRun = process.env.STANDALONE_CRON === 'true';
```

**Lint rule sugerida** (TODO): grep em `src/jobs/**/*.ts` por `import.meta.url === process.argv` e alertar.

---

## Checklist de deploy (pré-flight)

1. [ ] `npm run build` (API) passa local sem erro
2. [ ] `npx prisma validate` passa (schema consistente)
3. [ ] Auditoria schema vs migrations (ver script acima)
4. [ ] Testar boot do bundle local: `STANDALONE_CRON não setado; node build/server.js` — deve ficar de pé
5. [ ] Conferir env vars obrigatórios em Fly secrets (DATABASE_URL, JWT_SECRET, ANON_HASH_SECRET, BULLMQ_ENABLED, etc.)
6. [ ] Backup Neon branch + pg_dump local
7. [ ] Git push
8. [ ] `npx prisma migrate deploy` (ou deixar `release_command` fazer)
9. [ ] `fly deploy` com logs abertos em outra janela
10. [ ] Monitor pós-deploy: `/health/live`, BullMQ DLQ, Sentry

---

## Timeline de referência (deploy 2026-04-17)

| Hora  | Evento                                                               |
| ----- | -------------------------------------------------------------------- |
| 20:57 | Backup Neon branch + pg_dump                                         |
| 20:58 | Git push (226 API + 234 APP)                                         |
| 00:08 | Deploy 1 API → **falha migration 700**                               |
| 00:16 | Hotfix migration 650 + delete row falhada + deploy 2 → timeout lease |
| 00:20 | Leases limpos + deploy 3 → **grace_period insuficiente**             |
| 00:33 | Hotfix grace_period 120→300s + deploy 4 → **exit code 0 loop**       |
| 00:40 | Hotfix STANDALONE_CRON gate + deploy 5 → **API saudável**            |
| 00:45 | Deploy APP concluído                                                 |
| 00:50 | BullMQ workers confirmados                                           |

**Total:** deploy começou 20:58, estabilizou 00:50. ~4h devido aos 3 incidentes. Com este handbook, deploy similar deveria rodar em ~30min.

---

## Verificações pós-deploy

```bash
# Health
curl https://opensea-api.fly.dev/health/live    # esperado: 200 {"status":"alive"}
curl https://opensea-api.fly.dev/docs           # esperado: 404 em prod (Swagger off)

# BullMQ workers ativos (logs)
fly logs -a opensea-api | grep "calendar-reminders"    # esperado: processed a cada 60s

# DLQ (jobs falhados)
fly logs -a opensea-api | grep -i "DLQ\|failed"

# Machines health
fly status -a opensea-api                       # esperado: 2/2 started, all passing
```
