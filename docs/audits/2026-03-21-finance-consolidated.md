# Relatório Consolidado de Auditoria: Módulo Finance (v2)

**Data:** 2026-03-21
**Escopo:** Finance completo (Backend + Frontend)
**Repos:** OpenSea-API + OpenSea-APP
**Referência anterior:** 2026-03-10 (nota 7.8/10)

---

## Nota Geral: 6.2/10

A nota caiu em relação à auditoria anterior porque esta revisão aplicou critérios mais rigorosos de conformidade com o padrão do módulo stock (referência gold standard) e identificou débito técnico estrutural significativo no frontend.

---

## Notas por Dimensão

| Dimensão | Nota | Peso | Status | Mudança vs 03-10 |
|----------|------|------|--------|-------------------|
| Segurança | 5.0/10 | 14% | CRÍTICO | ↓ 3.0 (sem permissões RBAC) |
| Integridade de Dados | 7.0/10 | 14% | Atenção | ↓ 0.5 |
| Regras de Negócio | 8.5/10 | 11% | Bom | = |
| Contrato API | 7.5/10 | 10% | Atenção | ↓ 0.5 |
| Testes | 8.0/10 | 10% | Bom | ↓ 0.5 |
| Padronização Frontend | 3.5/10 | 9% | CRÍTICO | ↓ 4.5 (novo critério rigoroso) |
| Performance | 6.5/10 | 8% | Atenção | ↓ 0.5 |
| UI/UX Design | 4.0/10 | 6% | CRÍTICO | ↓ 3.5 (novo critério rigoroso) |
| Responsividade | 7.0/10 | 6% | Atenção | ↓ 0.5 |
| Acessibilidade | 6.5/10 | 5% | Atenção | = |
| Design System | 4.5/10 | 4% | CRÍTICO | ↓ 3.5 |
| Governança | 8.0/10 | 3% | Bom | = |

---

## PARTE 1: BACKEND (OpenSea-API)

### 1.1 Segurança (5.0/10) — CRÍTICO

**O que está bom:**
- Todos os 73+ controllers têm `verifyJwt`
- Todas as rotas passam por `createModuleMiddleware('FINANCE')`
- Criptografia AES-GCM de campos sensíveis (boleto, supplierName, customerName)
- Validação Zod em todas as entradas
- Soft delete com `deletedAt`
- Tenant isolation em todas as queries
- `$queryRawUnsafe` usa parâmetros posicionais (seguro contra SQL injection)

**Problemas CRÍTICOS:**

| # | Severidade | Problema | Impacto |
|---|-----------|---------|---------|
| S1 | CRÍTICO | **NENHUM controller usa `verifyPermission()`** — qualquer usuário autenticado no tenant executa TODAS as operações financeiras | Qualquer funcionário pode deletar lançamentos, registrar pagamentos, cancelar contratos |
| S2 | CRÍTICO | **74/76 controllers usam `onRequest` em vez de `preHandler`** (violação ADR 026) | Middleware ordering incorreto — erro pode capturar exceção antes de verificar JWT/tenant |
| S3 | MÉDIO | DELETE endpoints sem verificação de PIN no backend | Deleção sem confirmação de segurança |
| S4 | BAIXO | Sem rate limiting em endpoints sensíveis (OCR, import, boleto) | |
| S5 | BAIXO | Sem audit logging para operações financeiras críticas | |

**Ação imediata:** Adicionar `createPermissionMiddleware()` com `preHandler` em todos os 74 controllers. Os 48 permission codes já existem.

---

### 1.2 Integridade de Dados (7.0/10) — Atenção

**O que está bom:**
- TransactionManager em 5 use cases críticos
- Prisma.Decimal para campos monetários no banco
- Validação de rateio (soma = 100%)
- Status machine coerente

**Problemas:**

| # | Severidade | Problema |
|---|-----------|---------|
| D1 | CRÍTICO | **Race condition em `generateNextCode`** — códigos duplicados em concorrência |
| D2 | MÉDIO | **`RegisterPaymentUseCase` sem transação** — múltiplas writes podem falhar parcialmente |
| D3 | MÉDIO | **Float arithmetic em valores monetários** na camada de domínio (`number` em vez de Decimal) |
| D4 | BAIXO | Delete sem verificação de status (permite "deletar" entry já PAID) |

---

### 1.3 Regras de Negócio (8.5/10) — Bom

Modelo completo e bem implementado:
- PAYABLE/RECEIVABLE, SINGLE/RECURRING/INSTALLMENT
- Rateio, juros/multa automáticos, boleto parsing, OCR
- Contratos com auto-renew, consórcios com contemplation
- Dashboard com DRE, cashflow, forecast

**Problemas menores:**
- Sem validação `dueDate >= issueDate` no schema Zod
- `competenceDate` sem fallback para `issueDate`
- Tags sem normalização (trim + lowercase)

---

### 1.4 Contrato API (7.5/10)

**Problemas:**
- Divergência `perPage` (frontend) vs `limit` (backend)
- `costCenterId` obrigatório no tipo frontend, nullable no backend
- Permissão `ADMIN` usada em register-payment (muito ampla)

---

### 1.5 Testes (8.0/10)

- 66 unit tests (~335 test cases) + 45 E2E tests (~100 test cases)
- Cobertura: ~98.5% dos use cases
- Factories bem estruturadas

**Problemas:**
- E2E tests superficiais (2 cases por arquivo: happy path + auth)
- Sem testes de concorrência
- Sem testes de multi-tenant isolation

---

### 1.6 Performance (6.5/10)

**Problemas:**
- **CRÍTICO**: Search e agrupamento em campos criptografados NÃO FUNCIONA
- Landing page dispara 9 requests paralelos em vez de 1 endpoint consolidado
- Sem HTTP caching em endpoints readonly

---

## PARTE 2: FRONTEND (OpenSea-APP) — PROBLEMAS ESTRUTURAIS

### 2.1 Padronização Frontend (3.5/10) — CRÍTICO

O módulo finance **NÃO segue o padrão estabelecido no stock**. Cada página foi implementada de forma diferente, criando 5+ implementações distintas do mesmo conceito.

#### Matriz de Conformidade (Stock = referência)

| Critério | Stock ✅ | Payable | Receivable | Bank Accts | Loans | Categories | Cost Centers | Consortia | Contracts | Recurring |
|----------|---------|---------|-----------|-----------|-------|-----------|--------------|-----------|-----------|-----------|
| EntityGrid | ✅ | ❌ Table | ❌ Table | ✅ | ❌ Table | ❌ Table | ✅ | ❌ Table | ❌ Table | ❌ Custom |
| Infinite Scroll | ✅ | ✅ | ✅ | ❌ useQuery | ✅ | ❌ useQuery | ❌ useQuery | ❌ useQuery | ❌ useQuery | ✅ |
| Server-side Sort | ✅ onSortChange | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Filters in toolbarStart | ✅ | ❌ Acima | ❌ Acima | ✅ | ❌ Acima | ❌ | ✅ | ❌ Acima | ❌ Acima | ❌ |
| Debounced Search | ✅ 300ms | ❌ | ❌ | ✅ client | ❌ | ✅ client | ✅ client | ❌ | ❌ | ❌ |
| IntersectionObserver | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-select | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SelectionToolbar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Wizard Create | ✅ | ✅ | ✅ | ❌ Simple modal | ❌ | ❌ Simple modal | ❌ Simple modal | ❌ Simple modal | ❌ Simple modal | ✅ |

**Resumo devastador:**
- **7/9 páginas** usam `<Table>` raw em vez de EntityGrid
- **6/9 páginas** usam `useQuery` em vez de `useInfiniteQuery`
- **0/9 páginas** têm server-side sorting
- **0/9 páginas** têm IntersectionObserver sentinel
- **0/9 páginas** suportam multi-select / bulk actions
- **5/9 modais de criação** são `Dialog` simples (não wizard)
- **5/9 páginas** colocam filtros ACIMA do grid (não dentro de toolbarStart)

---

### 2.2 UI/UX Design (4.0/10) — CRÍTICO

**Problemas estruturais de design:**

| # | Problema | Páginas afetadas |
|---|---------|-----------------|
| U1 | **Raw `<Table>` com colunas hardcoded** em vez de EntityGrid responsivo | Payable, Receivable, Loans, Categories, Consortia, Contracts, Recurring |
| U2 | **Filtros como painel separado acima da tabela** em vez de FilterDropdowns dentro do toolbar | Payable, Receivable, Loans, Consortia, Contracts |
| U3 | **Sem multi-select** — usuário só age em 1 item por vez | TODAS as 9 páginas |
| U4 | **Sem dual view (grid/list)** — apenas table view | TODAS exceto Bank Accounts e Cost Centers |
| U5 | **Modais de criação simples** em vez de wizard | Bank Accounts, Categories, Cost Centers, Consortia, Contracts |
| U6 | **Consortia e Contracts usam modais para view/edit** (deveria ser página dedicada) | Consortia, Contracts |
| U7 | **Edit pages vazias** para Payable e Receivable | payable/[id]/edit, receivable/[id]/edit |
| U8 | **Recurring sem edit page** | recurring/ |

---

### 2.3 Design System (4.5/10) — CRÍTICO

| # | Problema | Detalhes |
|---|---------|---------|
| DS1 | **Cor Red usada em vez de Rose** para ações destrutivas | bank-accounts badges, asteriscos de required fields |
| DS2 | **5 implementações diferentes de tabela** | EntityGrid, raw Table com diferentes estilos |
| DS3 | **Filtros inconsistentes** | Select, Popover, Button custom — deveria ser FilterDropdown |
| DS4 | **Loading states inconsistentes** | GridLoading (stock) vs TableSkeleton custom (finance) |
| DS5 | **Import de permissões inconsistente** | `PermissionCodes.FINANCE` vs `FINANCE_PERMISSIONS` |
| DS6 | **Campo description em bank-account edit não é persistido** | Inicializa no form mas não envia na mutation |

---

## PARTE 3: PROBLEMAS HERDADOS DA AUDITORIA 03-10 (NÃO CORRIGIDOS)

Todos os 10 problemas críticos identificados em 2026-03-10 **continuam sem correção**:

| # | Problema | Status |
|---|---------|--------|
| 1 | Nenhum controller usa `verifyPermission()` | ❌ Não corrigido |
| 2 | Race condition em `generateNextCode` | ❌ Não corrigido |
| 3 | Search em campos criptografados não funciona | ❌ Não corrigido |
| 4 | `RegisterPaymentUseCase` sem transação | ❌ Não corrigido |
| 5 | Float arithmetic em valores monetários | ❌ Não corrigido |
| 6 | Landing page faz 9 requests | ❌ Não corrigido |
| 7 | Sem HTTP caching | ❌ Não corrigido |
| 8 | `costCenterId` type mismatch | ❌ Não corrigido |
| 9 | Entity props usam `string` em vez de enums | ❌ Não corrigido |
| 10 | Tabelas sem aria-labels | ❌ Não corrigido |

---

## PARTE 4: PLANO DE CORREÇÃO PRIORIZADO

### Fase 1: Segurança (URGENTE — impede produção)

| # | Tarefa | Esforço | Impacto |
|---|--------|---------|---------|
| 1.1 | Migrar 74 controllers `onRequest` → `preHandler` | 2h | ADR 026 compliance |
| 1.2 | Adicionar `createPermissionMiddleware()` em todos os controllers | 3h | RBAC ativado |
| 1.3 | Envolver `RegisterPaymentUseCase` em transação | 1h | Integridade |
| 1.4 | Corrigir `generateNextCode` (SELECT FOR UPDATE) | 3h | Concurrency safety |

### Fase 2: Frontend — Refatoração Estrutural

| # | Tarefa | Esforço | Páginas |
|---|--------|---------|---------|
| 2.1 | **Refatorar Payable para EntityGrid + Infinite Scroll** (modelo para as demais) | 6h | 1 página |
| 2.2 | Replicar padrão para Receivable | 4h | 1 página |
| 2.3 | Refatorar Loans para EntityGrid | 4h | 1 página |
| 2.4 | Refatorar Categories para EntityGrid | 3h | 1 página |
| 2.5 | Refatorar Consortia para EntityGrid + criar pages [id] e [id]/edit | 5h | 1 página |
| 2.6 | Refatorar Contracts para EntityGrid + criar pages [id] e [id]/edit | 5h | 1 página |
| 2.7 | Converter Bank Accounts, Categories, Cost Centers para wizard create | 4h | 3 páginas |
| 2.8 | Implementar edit pages para Payable e Receivable | 6h | 2 páginas |
| 2.9 | Adicionar multi-select + SelectionToolbar em todas as páginas | 4h | 9 páginas |

### Fase 3: Correções de Design

| # | Tarefa | Esforço |
|---|--------|---------|
| 3.1 | Substituir Red → Rose em todos os componentes | 1h |
| 3.2 | Padronizar imports de permissões | 1h |
| 3.3 | Corrigir campo description no bank-account edit | 0.5h |
| 3.4 | Adicionar useDebounce(300ms) em todas as buscas server-side | 1h |
| 3.5 | Padronizar loading states (usar GridLoading) | 1h |

### Fase 4: Backend — Melhorias

| # | Tarefa | Esforço |
|---|--------|---------|
| 4.1 | Resolver search em campos criptografados | 8h |
| 4.2 | Criar endpoint consolidado `/v1/finance/overview` | 3h |
| 4.3 | Validação `dueDate >= issueDate` | 0.5h |
| 4.4 | Normalização de tags | 0.5h |
| 4.5 | Adicionar HTTP caching em endpoints readonly | 2h |

---

## Estimativa de Esforço Total

| Fase | Horas | Prioridade |
|------|-------|-----------|
| Fase 1: Segurança | ~9h | P0 — URGENTE |
| Fase 2: Frontend Estrutural | ~41h | P1 — ALTO |
| Fase 3: Design Fixes | ~4.5h | P2 — MÉDIO |
| Fase 4: Backend Melhorias | ~14h | P2 — MÉDIO |
| **TOTAL** | **~68.5h** | |

---

## Nota Projetada Após Correções

| Dimensão | Atual | Projetada |
|----------|-------|-----------|
| Segurança | 5.0 | 9.0 |
| Integridade | 7.0 | 8.5 |
| Padronização Frontend | 3.5 | 8.5 |
| UI/UX Design | 4.0 | 8.5 |
| Design System | 4.5 | 8.5 |
| **Nota Geral** | **6.2** | **~8.5** |
