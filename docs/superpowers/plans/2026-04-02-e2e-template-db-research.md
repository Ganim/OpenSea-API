# Research: Template Database para E2E — Edge Cases e Compatibilidade

## Veredicto: COMPATÍVEL — elimina bugs existentes

O Template Database **não apenas é compatível**, como **elimina o bug raiz** (PrismaPg ignora `{ schema }` — Issue #28611) que causa os P1014 intermitentes.

## Descobertas Chave

### Prisma 7 + PrismaPg + Template DB

- Cada worker cria seu PrismaClient apontando para seu próprio database — sem conflitos
- Bug #28611 (schema parameter ignorado) é **eliminado** — tudo usa `public` schema
- Cada worker é processo separado (pool: forks) — singleton do Prisma funciona normalmente
- `VITEST_POOL_ID` env var identifica cada worker para derivar nome do DB

### CREATE DATABASE ... TEMPLATE

- **Restrição crítica:** template não pode ter conexões ativas durante clone
- Sequences clonadas com valores atuais (comportamento desejado)
- Advisory locks são per-session, não copiados
- **Speed:** ~1-2s para 349 tabelas vazias (WAL_LOG strategy)
- Migrations não precisam rodar nos clones (já aplicadas no template)

### Vitest Parallel Workers

- `globalSetup` roda 1x no processo main, ANTES dos workers — cria template lá
- `setupFiles` roda dentro de cada worker — clona template lá
- `process.env.DATABASE_URL` setado antes de importar app funciona perfeitamente

### Connection Limits

- 4 workers × 10 pool = 40 conexões (default PG max = 100)
- Mitigação: `max: 3` no pool reduz para 12 conexões total
- Docker PG pode ter limite menor — verificar docker-compose

### Cleanup

- `afterAll` no setupFiles dropa o DB do worker
- `globalSetup` cleanup dropa orphans `test_e2e_*` no início
- Template precisa `ALTER DATABASE IS_TEMPLATE false` antes de drop
- `pg_terminate_backend()` para matar conexões stale antes de drop

## Riscos Identificados

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Template com conexão ativa bloqueia clone | Média | Disconnect no globalSetup após seed |
| Worker crash deixa DB orphan | Baixa | Cleanup no startup (já fazemos com schemas) |
| Connection limit com 4+ workers | Baixa | `max: 3` no pool de cada worker |
| `prisma migrate deploy` no template pode falhar (#28950) | Baixa | Retry + usar DATABASE_URL direto |

## Fontes

- prisma/prisma#28611: PrismaPg ignora schema parameter
- prisma/prisma#28770: connectionString defaults to public
- prisma/prisma#28950: migrate deploy fails on local DB
- PostgreSQL docs: Template Databases, CREATE DATABASE
