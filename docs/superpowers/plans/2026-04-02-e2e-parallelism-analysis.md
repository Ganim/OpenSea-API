# E2E Parallelism — Análise de Alternativas

## Diagnóstico de Tempo

Dados dos runs parciais (post Camadas 1+2):

| Run | Specs | Setup | Collect | Tests | Total |
|-----|-------|-------|---------|-------|-------|
| audit | 4 | 77s | 113s | 16s | 207s |
| requests | 9 | 103s | 142s | 31s | 277s |

### Breakdown:

- **Setup** (~77-103s): Template clone (341ms) + Prisma seed check + vitest boot
- **Collect** (~113-142s): Importar TODOS os spec files + dependências (TypeScript → JS). **Custo fixo** por invocação vitest, independente de quantos specs rodam.
- **Tests** (~3-4s/spec): HTTP calls + assertions. **Escala linearmente**.

### Projeção para suite completa (1314 specs):

| Cenário | Custo fixo | Custo linear | Total estimado |
|---------|-----------|-------------|----------------|
| 1 processo (atual) | ~180s | 3s × 1314 = 3942s | **~69 min** |
| 2 shards | ~180s × 2 | 3s × 657 = 1971s | **~36 min** |
| 4 shards | ~180s × 4 | 3s × 328 = 984s | **~20 min** |
| 8 shards | ~180s × 8 | 3s × 164 = 492s | **~12 min** |

**O custo fixo domina em shards pequenos.** Com 8 shards, o custo fixo (180s × 8 = 1440s) é maior que o custo dos testes (492s). Mas como rodam em paralelo, o tempo real é max(180s + 492s) = **~12 min**.

---

## 3 Abordagens Comparadas

### Abordagem A: Script de Sharding por Módulo (RECOMENDADA)

**Como funciona:**
- Script bash/node que roda N processos vitest em paralelo
- Cada processo: clone do template DB + subset de specs
- Sem mudanças no vitest config ou nos testes

```bash
# run-e2e-sharded.sh
#!/bin/bash
# Shard 1: HR (319 specs) — o maior módulo, sozinho
vitest run --config vitest.e2e.config.ts src/http/controllers/hr/ &

# Shard 2: Sales + Finance (389 specs)
vitest run --config vitest.e2e.config.ts src/http/controllers/sales/ src/http/controllers/finance/ &

# Shard 3: Stock + Core + Admin (307 specs)
vitest run --config vitest.e2e.config.ts src/http/controllers/stock/ src/http/controllers/core/ src/http/controllers/admin/ &

# Shard 4: Todos os outros (299 specs)
vitest run --config vitest.e2e.config.ts src/http/controllers/tasks/ src/http/controllers/storage/ ... &

wait
```

**Prós:**
- Zero mudanças no vitest config
- Zero mudanças nos testes
- Cada shard tem seu próprio DB clone (template DB já suporta)
- Funciona em CI com GitHub Actions matrix
- Balanceamento manual controlável

**Contras:**
- Cada shard paga o custo fixo de collect (~113-142s)
- Precisa de script separado
- Precisa de mais conexões PostgreSQL (4 shards × 10 pool = 40)

**Tempo estimado:** ~20-22 min com 4 shards

**Risco:** Baixo. Cada shard é um processo independente.

---

### Abordagem B: Vitest `singleFork: false` (Layer 3 original)

**Como funciona:**
- Remove `singleFork: true` → vitest roda specs em workers paralelos
- Cada worker precisa de seu próprio DB
- Setup cria N clones do template (1 por worker)

**Mudanças necessárias:**
1. `vite.config.mjs`: `singleFork: false`
2. `prisma/vitest-setup-e2e.ts`: Criar DB por `VITEST_POOL_ID`
3. `src/lib/prisma.ts`: Garantir que reconecta ao DB correto do worker

**Prós:**
- Vitest gerencia o paralelismo automaticamente
- File-level parallelism (cada spec em worker separado)

**Contras:**
- **PROBLEMA CRÍTICO:** Cada worker precisa inicializar o Fastify (`app.ready()`).
  Com `singleFork: true`, o app inicializa 1x e é reusado. Com `false`, cada spec
  file faz `app.ready()` no seu próprio worker. Se workers executam specs
  sequencialmente, OK. Se em paralelo, cada worker faz 1 boot — funciona.
  MAS: o boot do Fastify com ~450 plugins leva ~5-10s. Com 4 workers,
  são 4 boots (paralelos), não 1314. Então funciona.
- **PROBLEMA:** Cada worker recompila TypeScript independentemente.
  O `collect` de ~113s é por worker. Com 4 workers paralelos, é ~113s
  (paralelo, não 4×113s).
- **PROBLEMA:** Conexões PostgreSQL: 4 workers × 10 pool = 40 conexões.
  Precisa ajustar pool size ou PostgreSQL max_connections.
- **RISCO:** Testes que dependem implicitamente de execução sequencial
  (ex: usam o mesmo nome de entidade sem timestamp) podem ter race conditions.

**Tempo estimado:** ~15-20 min com 4 workers

**Risco:** Médio. Requer validação cuidadosa de todos os 1314 specs.

---

### Abordagem C: Vitest `--shard` flag nativa

**Como funciona:**
- Vitest tem suporte nativo a sharding: `vitest run --shard=1/4`
- Distribui specs automaticamente entre N shards
- Cada shard roda como processo independente

**Prós:**
- Feature nativa do vitest, sem scripts custom
- Distribuição automática de specs
- Funciona out-of-the-box em CI

**Contras:**
- Cada shard paga custo fixo completo
- Distribuição pode ser desequilibrada (vitest distribui por file count, não por duração)
- Cada shard precisa de seu próprio DB clone
- O `vitest-setup-e2e.ts` já cria um DB por run, então funciona naturalmente

**Mudanças necessárias:**
1. Apenas no script de CI / local:
   ```bash
   vitest run --shard=1/4 &
   vitest run --shard=2/4 &
   vitest run --shard=3/4 &
   vitest run --shard=4/4 &
   wait
   ```

**Tempo estimado:** ~18-22 min com 4 shards (pode ser desequilibrado)

**Risco:** Baixo. Mesma lógica da Abordagem A mas automatizado.

---

## Recomendação

### Para produção: Abordagem C (--shard) + pequenos ajustes

1. **Usar `vitest --shard=N/M`** — zero mudanças de código, máximo benefício
2. **Cada shard já cria seu próprio DB clone** (o setup atual faz isso)
3. **Reduzir pool size** para `max: 3` no PrismaPg para não esgotar conexões
4. **Adicionar script helper** e targets no package.json

### Implementação mínima:

```json
// package.json scripts
"test:e2e:shard": "concurrently \"vitest run --shard=1/4\" \"vitest run --shard=2/4\" \"vitest run --shard=3/4\" \"vitest run --shard=4/4\"",
```

Ou no CI (GitHub Actions):
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx vitest run --shard=${{ matrix.shard }}/4
```

### Por que NÃO a Abordagem B (singleFork: false)?

- Complexidade de garantir isolamento de DB por worker
- Risco de race conditions em testes existentes
- O `collect` paralelo NÃO é mais rápido (vitest compila tudo de qualquer forma)
- `--shard` dá o mesmo benefício com zero risco

---

## Otimizações Adicionais (independentes do sharding)

### 1. Reduzir custo do `collect` (~113-142s)

O collect é vitest importando todos os spec files e transformando TypeScript.
Possível otimização: usar `vitest.config` com `deps.optimizer.web.include`
para pré-bundlar dependências pesadas.

### 2. Cache do template DB

Atualmente, o setup verifica se o template existe e roda `migrate deploy`
(que é idempotente). Possível otimização: checar hash das migrations e
skip se não mudaram. Economia: ~5-10s por shard.

### 3. `app.ready()` global

Com `singleFork: true`, o app já é compartilhado entre specs.
Mas cada spec file chama `app.ready()` no `beforeAll`.
Se movêssemos para o setup file, economizaríamos ~1s × 1314 = ~22 min
(o boot do Fastify com 450+ plugins).

**WAIT** — isso é potencialmente a otimização mais impactante. Preciso
investigar se `app.ready()` retorna instantaneamente na 2ª chamada.

### 4. Pool size do PrismaPg

Cada PrismaPg cria um pool de 10 conexões por default.
E2E tests fazem 1 query por vez. Reduzir para `max: 3`:
- Menos conexões PostgreSQL
- Menor memory footprint
- Sem impacto em performance (tests são sequenciais)
