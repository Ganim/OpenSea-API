# Runbook — Backfill de Permissões Phase 4

**Quando rodar:** Uma única vez por ambiente (local, staging, production) **logo após** aplicar as migrations da Phase 4 (em particular `20260418192113_add_punch_device_and_approval`), e **antes** de liberar qualquer uso dos endpoints `POST /v1/hr/punch-devices`, `GET /v1/hr/punch-approvals`, `POST /v1/hr/punch-approvals/:id/resolve` ou qualquer endpoint `hr.punch-*`.

**Por que é necessário:** A Phase 4 introduziu 8 novas permissões RBAC em `src/constants/rbac/permission-codes.ts` (commit `d30254f3`):

- `hr.punch-devices.access`
- `hr.punch-devices.register`
- `hr.punch-devices.modify`
- `hr.punch-devices.remove`
- `hr.punch-devices.admin`
- `hr.punch-approvals.access`
- `hr.punch-approvals.modify`
- `hr.punch-approvals.admin`

Essas permissões são concedidas automaticamente apenas a usuários CRIADOS após o commit (via `extractAllCodes(PermissionCodes)` no seed). Admins e owners pré-existentes (incluindo o seed `admin@teste.com` da "Empresa Demo") não as herdam e recebem `403 Forbidden`. Este script corrige o drift.

## Como rodar

```bash
cd OpenSea-API

# Local / dev (usa .env por padrão):
npm run backfill:phase4

# Staging:
npx tsx --env-file=.env.staging prisma/backfill-phase4-permissions.ts

# Production:
npx tsx --env-file=.env.production prisma/backfill-phase4-permissions.ts
```

## Idempotência

Seguro para rodar N vezes. Internamente:

- `permission` → `upsert` por `code` (cria se não existe, atualiza name/description/module/resource/action se existe)
- `permission_group_permissions` → `createMany({ skipDuplicates: true })` (não duplica nem remove)

Não há nenhum `deleteMany`. Diferença INTENCIONAL vs. `prisma/migrate-permissions.ts`, que reescreve do zero. Este script é puramente aditivo.

## Output esperado (sucesso)

```
🔄 Backfill de Permissões Phase 4

📝 Passo 1: Garantindo 8 permissões Phase 4...
   ✅ 8 permissions Phase 4 asseguradas (criadas ou atualizadas)

👥 Passo 2: Sincronizando admin groups...
   ✅ Admin group admin-xxxxxxxx (tenant: <uuid>) → {N} permissões
   ...(uma linha por grupo)...

👤 Passo 3: Sincronizando user groups...
   ✅ User group user-xxxxxxxx (tenant: <uuid>) → {M} permissões

🔎 Verificação final — cada admin group deve ter os 8 códigos Phase 4:
   ✅ Admin group admin-xxxxxxxx (tenant: <uuid>): 8/8 códigos Phase 4 presentes
   ...

✅ Backfill concluído com sucesso. Todos os admin groups têm os 8 códigos Phase 4.
```

Exit code: `0`.

## Query de sanidade pós-execução

Confirma via SQL que cada admin group tem exatamente 8 permissões `hr.punch-*`:

```sql
SELECT pg.slug, COUNT(*) AS punch_perms
FROM permission_group_permissions pgp
JOIN permission_groups pg ON pgp.group_id = pg.id
JOIN permissions p ON pgp.permission_id = p.id
WHERE pg.slug LIKE 'admin%' AND p.code LIKE 'hr.punch-%'
GROUP BY pg.slug;
```

Esperado: cada linha com `punch_perms = 8`.

## O que fazer se falhar

| Sintoma                                                 | Causa provável                                                                    | Correção                                                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `❌ Admin group X: faltam [...]`                        | Migration Phase 4 não aplicada, ou `permission-codes.ts` perdeu algum dos 8 codes | Rodar `npx prisma migrate status`; conferir `grep "PUNCH_DEVICES\|PUNCH_APPROVALS" src/constants/rbac/permission-codes.ts` |
| Erro de conexão DB                                      | `DATABASE_URL` ausente/incorreto                                                  | Conferir `.env` (ou variável passada via `--env-file=`)                                                                    |
| `Tenant sem admin group` (apenas warning, não bloqueia) | Tenant novo ainda não seedado completamente                                       | Rodar `npm run prisma:seed` para criar os grupos faltantes; depois re-rodar este script                                    |
| Endpoint ainda retorna 403 após backfill                | Cache de JWT antigo no cliente, ou usuário não está no admin group                | Reemitir login (renova JWT); confirmar via `SELECT * FROM user_permission_groups WHERE user_id = ...`                      |

## Validação end-to-end (curl)

Com o servidor rodando (`npm run dev`), exercitar os 3 endpoints com o seed admin:

```bash
TENANT_TOKEN=$(curl -s -X POST http://localhost:3333/v1/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teste.com","password":"Teste@123"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{process.stdout.write(JSON.parse(d).token)})")

# Esperado: 201
curl -X POST http://localhost:3333/v1/hr/punch-devices \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"BackfillTestDevice","deviceKind":"KIOSK_PUBLIC"}'

# Esperado: 200
curl http://localhost:3333/v1/hr/punch-approvals \
  -H "Authorization: Bearer $TENANT_TOKEN"

# Esperado: != 403 (404 ou 400 são aceitáveis — recurso não existe; o ponto é validar que o RBAC liberou hr.punch-approvals.admin)
curl -X POST http://localhost:3333/v1/hr/punch-approvals/00000000-0000-0000-0000-000000000000/resolve \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision":"APPROVED"}'
```

## Deprecation

Este script pode ser removido no início da Phase 6 ou 7, quando todos os ambientes já tiverem sido rodados. Até lá, mantém-se por segurança em re-deploys (rodar é uma no-op idempotente).
