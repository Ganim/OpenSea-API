# Design: Documentation & Audit Agent System

**Date:** 2026-03-10
**Status:** Approved
**Scope:** OpenSea-API + OpenSea-APP

---

## Overview

Sistema de agentes para documentar e auditar o projeto OpenSea de forma padronizada, versionada e automatizada. Composto por 15 componentes: 11 agentes de auditoria especializados, 1 orquestrador, 1 agente de documentacao, 1 hook Stop e 1 slash command.

---

## 1. Documentation Structure

### OpenSea-API/docs/

```
adr/                          # (existing) Architecture Decision Records
modules/                      # Per-module documentation
  stock.md
  finance.md
  calendar.md
  email.md
  hr.md
  sales.md
  rbac.md
  storage.md
  tasks.md
  core.md                     # Auth, users, sessions, tenants
patterns/                     # Technical patterns
  repository-pattern.md
  use-case-pattern.md
  factory-pattern.md
  mapper-pattern.md
  error-handling.md
  pagination.md
  multi-tenant.md
  testing-strategy.md
guides/                       # How-to guides
  adding-new-module.md
  adding-new-entity.md
  adding-new-endpoint.md
audits/                       # Versioned audit reports
  security/
  performance/
  standards/
  data-integrity/
  testing/
  governance/
  api-contract/
  business-rules/
troubleshooting/              # Recurring problem solutions
disaster-recovery.md          # (existing)
monitoring-setup.md           # (existing)
slos.md                       # (existing)
```

### OpenSea-APP/docs/

```
modules/                      # Per-module documentation (frontend)
  stock.md
  finance.md
  calendar.md
  email.md
  hr.md
  sales.md
  tasks.md
  central.md                  # Super admin area
patterns/                     # Frontend patterns
  page-structure.md
  entity-list-pattern.md
  dashboard-pattern.md
  form-pattern.md
  hook-pattern.md
  state-management.md
  optimistic-updates.md
guides/
  adding-new-page.md
  adding-new-module.md
audits/
  ui-ux/
  accessibility/
  design-system/
  performance/
  standards/
  testing/
  governance/
  api-contract/
  business-rules/
troubleshooting/
```

---

## 2. Module Documentation Templates

### Backend Module Template

```markdown
# Module: {Name}

## Overview
(propósito, escopo, dependências com outros módulos)

## Entities
(campos, tipos, validações, value objects, diagrama de relacionamentos)

## Endpoints
| Method | Path | Permission | Request | Response |
|--------|------|------------|---------|----------|

## Business Rules
(invariantes, workflows, edge cases, state machines)

## Permissions
(códigos RBAC, escopos, middleware chain)

## Data Model
(Prisma schema excerpt, indexes, constraints)

## Tests
(cobertura %, cenários críticos, factories)

## Audit History
| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
```

### Frontend Module Template

```markdown
# Module: {Name}

## Overview
(propósito, user flows, referência visual)

## Page Structure
(route tree, layout hierarchy, component tree por página)

## Components
(componentes específicos do módulo, props, composição)

## Hooks
(data fetching, mutations, optimistic updates)

## Types
(interfaces principais, status de sync com backend)

## State Management
(contexts, URL state, React Query keys)

## User Flows
(workflows passo-a-passo com transições de página)

## Audit History
| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
```

---

## 3. Agent Architecture

### Agent Inventory (15 components)

```
Documentation (2):
  doc-writer              -> Gera/atualiza docs de módulos, patterns, guides
  docs-review (hook+cmd)  -> Pós-sessão: analisa diff, sugere docs a atualizar

Audit (13):
  audit-orchestrator      -> Coordena auditorias em paralelo, consolida score
  audit-security          -> OWASP, auth, injection, headers (API)
  audit-performance       -> N+1, caching, bundle, rendering (Ambos)
  audit-standards         -> Convenções, naming, SOLID, Clean Arch (Ambos)
  audit-ui-ux             -> Consistência visual, responsividade, fluxos (APP)
  audit-accessibility     -> ARIA, keyboard, contrast, semantic HTML (APP)
  audit-design-system     -> shadcn/ui, Tailwind, tipografia, temas (APP)
  audit-data-integrity    -> Transações, race conditions, multi-tenant (API)
  audit-testing           -> Cobertura, qualidade, edge cases (Ambos)
  audit-governance        -> Dependências, licenças, CI/CD, tech debt (Ambos)
  audit-api-contract      -> Sync schemas <-> types, endpoints <-> chamadas (Ambos)
  audit-business-rules    -> Regras de negócio, gaps funcionais, mercado (Ambos)
```

### Audit Report Standard Format

```markdown
# Audit Report: {Dimension} -- {Module/Scope}

**Date:** YYYY-MM-DD
**Version:** vN
**Previous Score:** X.X/10 (or N/A)
**Current Score:** X.X/10

## Summary
(2-3 sentences: o que foi auditado, descobertas principais)

## Checklist

### Category A
| # | Criterion | Status | Severity | Notes |
|---|-----------|--------|----------|-------|
| 1 | Description | PASS/WARN/FAIL | critical/high/medium/low | Details |

## Score Calculation
- Total criteria: N
- PASS: X (Y%)
- WARN: X (Y%)
- FAIL: X (Y%)
- **Score: X.X/10** (PASS*1.0 + WARN*0.5 + FAIL*0.0) / total * 10

## Critical Issues (FAIL)
1. **[F-XX] Title** -- description, impact, suggested fix

## Warnings (WARN)
1. **[W-XX] Title** -- description, recommendation

## Recommendations
(prioritized action items for next audit cycle)

## Score History
| Date | Version | Score | Delta |
|------|---------|-------|-------|
```

### Audit Orchestrator Flow

```
User: "Audita o módulo de stock"
  |
  v
audit-orchestrator:
  1. Identifica escopo (módulo, repos afetados)
  2. Despacha agentes relevantes em paralelo
  3. Cada agente gera relatório em docs/audits/{dimension}/YYYY-MM-DD-{module}.md
  4. Orchestrator consolida: score geral = média ponderada
  5. Gera docs/audits/YYYY-MM-DD-{module}-consolidated.md
```

### docs-review Flow

```
Hook Stop:
  1. git diff (staged + unstaged) em ambos repos
  2. Identifica módulos tocados
  3. Verifica se docs/modules/{module}.md existe e está atualizado
  4. Pergunta: "Módulo X foi alterado. Deseja atualizar a documentação?"
  5. Se sim -> despacha doc-writer

Slash /docs-review:
  1. Mesmo fluxo, sob demanda
  2. Aceita argumento: /docs-review stock
  3. Sem argumento: analisa todos com mudanças recentes
```

---

## 4. Audit Criteria Per Agent

### 4.1 audit-security (API)
- Todas as rotas protegidas com verifyJwt
- Permissões RBAC aplicadas (verifyPermission)
- Rate limiting em endpoints sensíveis
- Input validation via Zod em todas as rotas
- SQL injection prevention (Prisma parameterized)
- XSS prevention (sanitização de output)
- CORS configurado corretamente
- Security headers (HSTS, CSP, X-Frame-Options)
- Secrets não expostos em logs/responses
- JWT expiration e refresh adequados
- SSRF protection em URLs externas
- File upload validation (tipo, tamanho, extensão)

### 4.2 audit-performance (Ambos)
**Backend:**
- Queries N+1 (includes/joins)
- Indexes adequados no Prisma schema
- Paginação em todos os endpoints de listagem
- Cache Redis para dados frequentes
- Queries com select para limitar campos

**Frontend:**
- Bundle size por rota (dynamic imports)
- React.memo em componentes pesados
- React Query com staleTime adequado
- Virtualização em listas longas
- Imagens otimizadas (next/image, lazy loading)
- No unnecessary re-renders

### 4.3 audit-standards (Ambos)
- Naming conventions (kebab-case, PascalCase, camelCase)
- Path aliases usados corretamente
- Clean Architecture respeitada
- Repository/Use Case/Factory/Mapper patterns seguidos
- Error handling consistente
- Imports organizados (sem circular deps)
- Sem código morto/comentado

### 4.4 audit-ui-ux (APP)
- Feedback visual em todas as ações (loading, success, error)
- Toasts com mensagens claras em PT-BR
- Confirmação antes de ações destrutivas
- Empty states informativos
- Responsividade (mobile, tablet, desktop)
- Fluxos completos (CRUD end-to-end)
- Navegação consistente (breadcrumbs, back buttons)
- Formulários com validação inline
- Skeleton loaders

### 4.5 audit-accessibility (APP)
- Semantic HTML (headings, landmarks)
- ARIA labels em elementos interativos
- Keyboard navigation funcional
- Focus management em modais
- Color contrast >= 4.5:1 (WCAG AA)
- htmlFor em todos os labels
- Alt text em imagens
- Skip navigation links
- Nenhum outline:none sem substituto

### 4.6 audit-design-system (APP)
- Componentes shadcn/ui (não HTML raw)
- Tailwind tokens consistentes
- Tipografia com hierarquia clara
- Tema claro/escuro funcional
- Espaçamento consistente (não valores arbitrários)
- Ícones de fonte única (react-icons)
- Pattern visual uniforme (cards, modais, tables)
- Cores semânticas (não hex hardcoded)
- Border radius, shadows consistentes
- Animações sutis e consistentes

### 4.7 audit-data-integrity (API)
- Transações em operações multi-step
- Multi-tenant isolation (tenantId em todas as queries)
- Soft delete consistente (deletedAt)
- Cascade deletes corretos
- Race conditions protegidas
- Unique constraints onde necessário
- Foreign keys íntegras
- Enum values sincronizados
- Seed data idempotente

### 4.8 audit-testing (Ambos)
- Coverage >= 70% lines
- Todos use cases com testes unitários
- Todos controllers com testes E2E
- Happy path + error cases cobertos
- Edge cases testados
- In-memory repositories corretos
- Test factories existem e são usadas
- Sem testes flaky
- Assertions significativas
- Testes de multi-tenant isolation

### 4.9 audit-governance (Ambos)
- Dependências atualizadas (no critical vulns)
- Licenças compatíveis
- CI/CD pipeline funcional
- Commitlint enforced
- Branch protection rules
- No secrets in code
- Docker build otimizado
- Documentation freshness
- Tech debt tracking (TODOs, FIXMEs)
- Changelog mantido

### 4.10 audit-api-contract (Ambos)
- Types frontend 1:1 com Zod schemas backend
- Todos endpoints usados no frontend existem no backend
- Enums sincronizados (Prisma -> backend -> frontend)
- Campos de data tratados consistentemente (string ISO)
- Paginação meta shape igual
- Error response shape consistente
- Campos opcionais marcados corretamente
- Request bodies completos
- Response types sem any
- Nenhum endpoint morto (sem uso no frontend)

### 4.11 audit-business-rules (Ambos)
- Features essenciais vs padrão de mercado
- Bounded contexts respeitados
- Fluxos de aprovação onde necessário
- Status machines completas
- Regras de negócio no domain layer
- Validações de domínio em value objects
- Integrações entre módulos (hooks, events)
- Relatórios/exports disponíveis
- Funcionalidades de auditoria/log
- Gap analysis vs concorrentes

---

## 5. Language Convention

- Titles and structural headings: English
- Descriptive content, business rules, notes: Portuguese (PT-BR formal)
- Code references, technical terms: English
- User-facing text in examples: Portuguese with proper accents

---

## 6. Versioning

- Audit reports are immutable once created (never edit, create new version)
- Filename pattern: `YYYY-MM-DD-{module}.md`
- Score History table at bottom tracks evolution
- Consolidated reports link to individual dimension reports
