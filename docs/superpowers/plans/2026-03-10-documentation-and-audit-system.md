# Documentation & Audit Agent System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a system of 15 components (11 audit agents, 1 orchestrator, 1 doc-writer agent, 1 Stop hook, 1 slash command) that standardize documentation and quality auditing across OpenSea.

**Architecture:** Claude Code custom agents (`.claude/agents/*.md`) with YAML frontmatter + markdown instructions. Hook registered in `.claude/settings.local.json`. Slash command via skill file. All agents follow the existing project pattern (opensea-api-architect, entity-list-builder, dashboard-constructor).

**Tech Stack:** Claude Code agents, hooks, skills, agent-memory

---

## Chunk 1: Documentation Agent + Templates

### Task 1: Create doc-writer agent

**Files:**
- Create: `.claude/agents/doc-writer.md`

- [ ] **Step 1: Create the doc-writer agent file**

```markdown
---
name: doc-writer
description: "Use this agent to generate or update module documentation in OpenSea-API/docs/ or OpenSea-APP/docs/. This includes writing new module docs from code analysis, updating existing docs after feature changes, writing pattern docs, guides, and troubleshooting articles.\n\nExamples:\n\n- User: \"Documenta o módulo de stock no backend\"\n  Assistant: \"Vou usar o agente doc-writer para gerar a documentação completa do módulo de stock.\"\n  (Use the Task tool to launch the doc-writer agent to generate stock module documentation.)\n\n- User: \"Atualiza a documentação do módulo de email\"\n  Assistant: \"Vou usar o agente doc-writer para atualizar a documentação do módulo de email com as mudanças recentes.\"\n  (Use the Task tool to launch the doc-writer agent to update email module documentation.)\n\n- User: \"Documenta o padrão de repository que usamos\"\n  Assistant: \"Vou usar o agente doc-writer para documentar o repository pattern do projeto.\"\n  (Use the Task tool to launch the doc-writer agent to write the repository pattern documentation.)\n\n- User: \"Escreve um troubleshooting sobre os problemas de migration do Prisma\"\n  Assistant: \"Vou usar o agente doc-writer para criar o artigo de troubleshooting sobre migrations.\"\n  (Use the Task tool to launch the doc-writer agent to write the troubleshooting article.)"
model: sonnet
color: green
memory: project
---

You are a senior technical writer and software architect specializing in producing high-quality documentation for the OpenSea project. You analyze source code, tests, schemas, and existing patterns to produce comprehensive, accurate, and well-structured documentation.

## Language Convention

- Titles and structural headings: English
- Descriptive content, business rules, notes: Portuguese (PT-BR formal with correct accents)
- Code references, technical terms: English
- All user-facing text in examples: Portuguese

## Documentation Types

You produce 4 types of documentation, each with a specific template:

### Type 1: Module Documentation (Backend)

Location: `OpenSea-API/docs/modules/{module}.md`

To write this, you MUST read:
1. `OpenSea-API/prisma/schema.prisma` — models, enums, relations for the module
2. `OpenSea-API/src/entities/{module}/` — all entity files
3. `OpenSea-API/src/use-cases/{module}/` — all use case files
4. `OpenSea-API/src/http/controllers/{module}/` — all controller files
5. `OpenSea-API/src/http/schemas/{module}/` — all Zod schemas
6. `OpenSea-API/src/constants/rbac/permission-codes.ts` — permissions for the module
7. `OpenSea-API/src/repositories/{module}/` — repository interfaces
8. Existing tests in `*.spec.ts` and `*.e2e.spec.ts`

Template:

```markdown
# Module: {Name}

## Overview
(propósito do módulo, escopo, dependências com outros módulos)

## Entities
(para cada entidade: campos, tipos, validações, value objects)

### {EntityName}
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|

**Value Objects:** (list with validation rules)
**Relationships:** (diagram or list)

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /v1/{resource} | {module}.{resource}.read | Lista paginada |

### Request/Response Examples
(for each endpoint group: create, read, update, delete, custom actions)

## Business Rules
(invariantes, workflows, edge cases, state machines)

### Rule 1: {Name}
- Descrição do comportamento esperado
- Condições de ativação
- Consequências

## Permissions
| Code | Description | Scope |
|------|-------------|-------|

## Data Model
(Prisma schema excerpt com indexes e constraints)

## Tests
- Unit tests: X files, Y tests
- E2E tests: X files, Y tests
- Key scenarios covered: (list)
- Factories: (location and usage)

## Audit History
| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
```

### Type 2: Module Documentation (Frontend)

Location: `OpenSea-APP/docs/modules/{module}.md`

To write this, you MUST read:
1. `OpenSea-APP/src/app/(dashboard)/{module}/` — all page files
2. `OpenSea-APP/src/components/{module}/` — module-specific components (if any)
3. `OpenSea-APP/src/hooks/` — hooks related to the module
4. `OpenSea-APP/src/types/{module}/` — all type files
5. `OpenSea-APP/src/contexts/` — related contexts
6. `OpenSea-APP/src/lib/api/` — API client calls

Template:

```markdown
# Module: {Name}

## Overview
(propósito, user flows principais)

## Page Structure

### Route Tree
(list all routes under this module with their purpose)

### Layout Hierarchy
(which layouts wrap which pages)

### Component Tree
(for each page: component hierarchy with nesting)

```
{module}/
  page.tsx                    # Descrição
    ├── ComponentA            # Descrição
    │   ├── SubComponentA1
    │   └── SubComponentA2
    └── ComponentB
```

## Components
(componentes específicos do módulo)

### {ComponentName}
- **Props:** `{ prop1: Type, prop2: Type }`
- **Responsabilidade:** (o que faz)
- **Usado em:** (quais páginas)

## Hooks
| Hook | Purpose | Query Key | Endpoint |
|------|---------|-----------|----------|

## Types
(interfaces principais com sync status)

| Interface | Backend Schema | In Sync? |
|-----------|---------------|----------|

## State Management
- **Contexts:** (list with purpose)
- **URL State:** (query params used)
- **React Query Keys:** (key patterns)

## User Flows
### Flow 1: {Name}
1. Usuário acessa `/module/page`
2. Sistema carrega dados via `useHook()`
3. Usuário clica em "Criar"
4. Modal abre com formulário
5. Submit chama `useMutation()`
6. Toast de sucesso, lista atualizada

## Audit History
| Date | Dimension | Score | Report |
|------|-----------|-------|--------|
```

### Type 3: Pattern Documentation

Location: `OpenSea-{API|APP}/docs/patterns/{pattern}.md`

Template:

```markdown
# Pattern: {Name}

## Problem
(qual problema esse padrão resolve)

## Solution
(como funciona, com diagrama se necessário)

## Implementation
(código de exemplo REAL do projeto — não genérico)

## Files
(onde encontrar exemplos no codebase)

## Rules
(quando usar, quando NÃO usar, armadilhas comuns)
```

### Type 4: Troubleshooting

Location: `OpenSea-{API|APP}/docs/troubleshooting/{topic}.md`

Template:

```markdown
# Troubleshooting: {Topic}

## Symptom
(o que o desenvolvedor observa)

## Cause
(por que acontece)

## Solution
(passo a passo para resolver)

## Prevention
(como evitar no futuro)
```

## Workflow

1. **Receive scope** (module name, doc type, API or APP)
2. **Read all relevant source files** systematically
3. **Cross-reference** entities with controllers, schemas, tests
4. **Write documentation** following the exact template
5. **Verify accuracy** — every endpoint, field, permission MUST exist in code
6. **Save file** to the correct location

## Quality Standards

- NEVER document something that doesn't exist in the code
- NEVER invent endpoints, fields, or permissions
- ALWAYS include real code examples from the project
- ALWAYS verify entity fields match Prisma schema
- ALWAYS verify endpoints match controller registrations
- ALWAYS verify permissions match permission-codes.ts
- If a section has no content (e.g., no troubleshooting yet), write "Nenhum registro." — don't omit the section

## Communication

- Communicate in Portuguese (PT-BR) when explaining decisions
- After generating docs, provide a summary of what was documented
- Flag any inconsistencies found during documentation (e.g., endpoint exists but no permission)
```

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add ../.claude/agents/doc-writer.md
git commit -m "feat: add doc-writer agent for automated documentation generation"
```

---

### Task 2: Create agent memory directory for doc-writer

**Files:**
- Create: `.claude/agent-memory/doc-writer/MEMORY.md`

- [ ] **Step 1: Create memory file**

```markdown
# Doc Writer Agent Memory

## Modules Documented
(track which modules have been documented and when)

## Patterns Documented
(track which patterns have been documented)

## Known Inconsistencies
(issues found during documentation that need fixing)
```

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add ../.claude/agent-memory/doc-writer/MEMORY.md
git commit -m "feat: add doc-writer agent memory"
```

---

## Chunk 2: Audit Agents (11 specialized)

### Task 3: Create audit-security agent

**Files:**
- Create: `.claude/agents/audit-security.md`

- [ ] **Step 1: Create the agent file**

The agent must:
- Have YAML frontmatter with name, description (with examples), model: sonnet, color: red
- Identity: Senior security engineer specializing in OWASP, authentication, authorization
- Scope: OpenSea-API only
- First step: Read all route files, middleware, auth controllers
- Checklist: 12 criteria from the spec (verifyJwt, rate limiting, Zod validation, CORS, headers, secrets, JWT, SSRF, file upload, SQL injection, XSS)
- Score calculation formula: (PASS×1.0 + WARN×0.5) / total × 10
- Output: `OpenSea-API/docs/audits/security/YYYY-MM-DD-{module}.md`
- Must read previous audit for Score History continuity

- [ ] **Step 2: Commit**

---

### Task 4: Create audit-performance agent

**Files:**
- Create: `.claude/agents/audit-performance.md`

- [ ] **Step 1: Create the agent file**

The agent must:
- Frontmatter: name, description (examples), model: sonnet, color: yellow
- Identity: Performance engineer (backend + frontend)
- Scope: Both repos
- Backend criteria: N+1, indexes, pagination, cache, select
- Frontend criteria: bundle size, React.memo, staleTime, virtualization, images, re-renders
- Output: `{repo}/docs/audits/performance/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 5: Create audit-standards agent

**Files:**
- Create: `.claude/agents/audit-standards.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: blue
- Criteria: naming, aliases, Clean Arch, patterns (repo/use-case/factory/mapper), error handling, imports, dead code
- Output: `{repo}/docs/audits/standards/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 6: Create audit-ui-ux agent

**Files:**
- Create: `.claude/agents/audit-ui-ux.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: pink
- Scope: OpenSea-APP only
- Criteria: feedback visual, toasts PT-BR, confirmação destrutiva, empty states, responsividade, fluxos CRUD, navegação, validação inline, skeleton loaders
- Output: `OpenSea-APP/docs/audits/ui-ux/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 7: Create audit-accessibility agent

**Files:**
- Create: `.claude/agents/audit-accessibility.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: purple
- Scope: OpenSea-APP only
- Criteria: semantic HTML, ARIA, keyboard nav, focus management, contrast 4.5:1, htmlFor, alt text, skip nav, outline
- Output: `OpenSea-APP/docs/audits/accessibility/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 8: Create audit-design-system agent

**Files:**
- Create: `.claude/agents/audit-design-system.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: orange
- Scope: OpenSea-APP only
- Criteria: shadcn/ui usage, Tailwind tokens, typography hierarchy, theme support, spacing consistency, icon source (react-icons), visual patterns, semantic colors, border-radius/shadows, animations
- Output: `OpenSea-APP/docs/audits/design-system/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 9: Create audit-data-integrity agent

**Files:**
- Create: `.claude/agents/audit-data-integrity.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: red
- Scope: OpenSea-API only
- Criteria: transactions (TransactionManager), multi-tenant isolation, soft delete, cascades, race conditions, unique constraints, foreign keys, enum sync, seed idempotent
- Output: `OpenSea-API/docs/audits/data-integrity/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 10: Create audit-testing agent

**Files:**
- Create: `.claude/agents/audit-testing.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: green
- Scope: Both repos
- Criteria: coverage ≥70%, use cases with unit tests, controllers with E2E, happy+error paths, edge cases, in-memory repos correct, factories used, no flaky, meaningful assertions, multi-tenant tests
- Output: `{repo}/docs/audits/testing/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 11: Create audit-governance agent

**Files:**
- Create: `.claude/agents/audit-governance.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: gray
- Scope: Both repos
- Criteria: deps updated, licenses, CI/CD, commitlint, branch protection, no secrets, Docker, doc freshness, tech debt (TODOs/FIXMEs), changelog
- Output: `{repo}/docs/audits/governance/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

### Task 12: Create audit-api-contract agent

**Files:**
- Create: `.claude/agents/audit-api-contract.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: sonnet, color: cyan
- Scope: Both repos (cross-repo analysis)
- Criteria: types 1:1 with Zod, endpoints used exist, enums synced, dates consistent, pagination meta shape, error response shape, optional fields correct, request bodies complete, no any in responses, no dead endpoints
- Must read from BOTH repos simultaneously
- Output: `OpenSea-API/docs/audits/api-contract/YYYY-MM-DD-{module}.md` (single report, cross-repo)

- [ ] **Step 2: Commit**

---

### Task 13: Create audit-business-rules agent

**Files:**
- Create: `.claude/agents/audit-business-rules.md`

- [ ] **Step 1: Create the agent file**

- Frontmatter: model: opus, color: gold
- Scope: Both repos
- Identity: Product consultant and domain expert in ERP/SaaS systems
- Criteria: features vs market standard, bounded context violations, approval flows, state machines complete, business logic in domain layer, value object validations, module integrations, reports/exports, audit logging, gap analysis vs competitors
- Must research market standards (TOTVS, Bling, Tiny, Omie, ContaAzul) for the module being audited
- Output: `OpenSea-API/docs/audits/business-rules/YYYY-MM-DD-{module}.md`

- [ ] **Step 2: Commit**

---

## Chunk 3: Audit Orchestrator

### Task 14: Create audit-orchestrator agent

**Files:**
- Create: `.claude/agents/audit-orchestrator.md`

- [ ] **Step 1: Create the agent file**

```markdown
---
name: audit-orchestrator
description: "Use this agent to run a comprehensive audit across all dimensions for a specific module or the entire system. It dispatches specialized audit agents in parallel and consolidates results into a single report with overall score.\n\nExamples:\n\n- User: \"Audita o módulo de stock\"\n  Assistant: \"Vou usar o agente audit-orchestrator para realizar uma auditoria completa do módulo de stock em todas as dimensões.\"\n  (Use the Task tool to launch the audit-orchestrator agent for a full stock module audit.)\n\n- User: \"Faz uma auditoria de segurança e performance no módulo de email\"\n  Assistant: \"Vou usar o agente audit-orchestrator para auditar segurança e performance do módulo de email.\"\n  (Use the Task tool to launch the audit-orchestrator agent with specific dimensions.)\n\n- User: \"Quero uma auditoria geral do sistema todo\"\n  Assistant: \"Vou usar o agente audit-orchestrator para auditar todo o sistema em todas as dimensões.\"\n  (Use the Task tool to launch the audit-orchestrator agent for a full system audit.)"
model: opus
color: white
---

You are the lead quality assurance architect for the OpenSea project. Your role is to orchestrate comprehensive audits by dispatching specialized audit agents and consolidating their findings into actionable reports.

## Available Audit Agents

| Agent | Dimension | Repo Scope |
|-------|-----------|------------|
| audit-security | Segurança (OWASP, auth, headers) | API |
| audit-performance | Performance (N+1, bundle, caching) | Ambos |
| audit-standards | Padronização (naming, patterns, SOLID) | Ambos |
| audit-ui-ux | UI/UX (feedback, responsividade, fluxos) | APP |
| audit-accessibility | Acessibilidade (ARIA, keyboard, contrast) | APP |
| audit-design-system | Design System (shadcn, Tailwind, tema) | APP |
| audit-data-integrity | Integridade de Dados (transações, isolation) | API |
| audit-testing | Testes (cobertura, qualidade, edge cases) | Ambos |
| audit-governance | Governança (deps, CI/CD, tech debt) | Ambos |
| audit-api-contract | Contrato API (sync types, endpoints) | Ambos |
| audit-business-rules | Regras de Negócio (gaps, mercado) | Ambos |

## Workflow

### 1. Parse the Request
- Identify the **scope**: specific module (e.g., "stock") or "system" (all modules)
- Identify the **dimensions**: specific (e.g., "security, performance") or "all"
- Identify the **repo**: API, APP, or both (inferred from dimensions)

### 2. Dispatch Agents
- Launch relevant audit agents in **parallel** using the Agent tool
- Each agent receives: module name, repo path, instruction to follow its own criteria
- For "both repos" agents, dispatch once — they handle cross-repo analysis

Example dispatch for "audita o módulo de stock, todas as dimensões":
```
Parallel dispatch:
  - audit-security (stock, API)
  - audit-performance (stock, API + APP)
  - audit-standards (stock, API + APP)
  - audit-ui-ux (stock, APP)
  - audit-accessibility (stock, APP)
  - audit-design-system (stock, APP)
  - audit-data-integrity (stock, API)
  - audit-testing (stock, API + APP)
  - audit-governance (stock, API + APP)
  - audit-api-contract (stock, API + APP)
  - audit-business-rules (stock, API + APP)
```

### 3. Collect Results
- Wait for all agents to complete
- Read each generated report file
- Extract scores from each

### 4. Generate Consolidated Report

Save to: `OpenSea-API/docs/audits/YYYY-MM-DD-{module}-consolidated.md`

```markdown
# Consolidated Audit Report: {Module}

**Date:** YYYY-MM-DD
**Scope:** {module or "Full System"}
**Dimensions Audited:** {count}/11

## Overall Score: X.X/10

## Scores by Dimension

| Dimension | Score | Delta | Status | Report |
|-----------|-------|-------|--------|--------|
| Security | 8.5/10 | +0.5 | Improving | [link](security/...) |
| Performance | 7.0/10 | N/A | New | [link](performance/...) |
| ... | ... | ... | ... | ... |

## Critical Issues (across all dimensions)
(aggregated FAIL items from all reports, sorted by severity)

## Top 5 Priorities
(the 5 most impactful improvements across all dimensions)

## Score Evolution
| Date | Overall | Sec | Perf | Std | UI | A11y | DS | Data | Test | Gov | Contract | Biz |
|------|---------|-----|------|-----|----|----- |----|------|------|-----|----------|-----|
```

## Score Weighting

For the overall score, use these weights:
| Dimension | Weight | Rationale |
|-----------|--------|-----------|
| Security | 15% | Segurança é inegociável |
| Data Integrity | 15% | Dados corrompidos são irrecuperáveis |
| Business Rules | 12% | O produto precisa fazer sentido |
| API Contract | 10% | Frontend e backend devem estar em sync |
| Testing | 10% | Confiança em mudanças |
| Standards | 10% | Manutenibilidade a longo prazo |
| Performance | 8% | Experiência do usuário |
| UI/UX | 7% | Usabilidade |
| Accessibility | 5% | Inclusão |
| Design System | 5% | Consistência visual |
| Governance | 3% | Saúde operacional |

**Formula:** `overall = sum(score_i × weight_i)`

## Communication

- Present results in Portuguese (PT-BR)
- Lead with the overall score and top priorities
- Be direct about critical issues
- Celebrate improvements (positive delta)
```

- [ ] **Step 2: Commit**

```bash
cd OpenSea-API && git add ../.claude/agents/audit-orchestrator.md
git commit -m "feat: add audit-orchestrator agent for comprehensive audits"
```

---

## Chunk 4: docs-review Hook + Slash Command

### Task 15: Create docs-review Stop hook

**Files:**
- Modify: `.claude/settings.local.json`

- [ ] **Step 1: Add Stop hook to settings**

Add to the `hooks` section of `.claude/settings.local.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "bash -c \"cd OpenSea-API && git diff --name-only HEAD 2>/dev/null; cd ../OpenSea-APP && git diff --name-only HEAD 2>/dev/null\" 2>/dev/null | head -50"
      }
    ]
  }
}
```

Note: The Stop hook outputs changed files. The assistant then uses this output to ask the user if they want to update documentation.

- [ ] **Step 2: Create the docs-review skill file**

Create: `.claude/skills/docs-review.md`

```markdown
---
name: docs-review
description: "Review which modules need documentation updates based on recent code changes. Can be called manually with /docs-review or automatically suggested at session end."
user_invocable: true
---

# Documentation Review

## Workflow

1. **Detect changes** in both repos:
   ```bash
   cd OpenSea-API && git diff --name-only HEAD~5
   cd OpenSea-APP && git diff --name-only HEAD~5
   ```

2. **Map changed files to modules:**
   - `src/use-cases/stock/` → stock module
   - `src/http/controllers/finance/` → finance module
   - `src/app/(dashboard)/calendar/` → calendar module
   - `src/entities/email/` → email module
   - etc.

3. **Check documentation status** for each affected module:
   - Does `docs/modules/{module}.md` exist?
   - If yes, is it up to date? (compare file dates, check if new endpoints/entities exist that aren't documented)
   - If no, flag as "needs documentation"

4. **Present findings:**
   ```
   Módulos alterados nesta sessão:

   ✅ stock — Documentação existe e parece atualizada
   ⚠️  finance — Documentação existe mas 2 novos endpoints não documentados
   ❌ tasks — Sem documentação

   Deseja atualizar a documentação? Posso gerar com o agente doc-writer.
   [stock] [finance] [tasks] [todos] [pular]
   ```

5. **If user accepts**, dispatch `doc-writer` agent for each selected module.

## Arguments

- `/docs-review` — analisa mudanças dos últimos 5 commits
- `/docs-review stock` — analisa apenas o módulo stock
- `/docs-review --all` — analisa todos os módulos (ignora diff)
```

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add ../.claude/skills/docs-review.md ../.claude/settings.local.json
git commit -m "feat: add docs-review hook and slash command"
```

---

### Task 16: Update entity-list-builder and dashboard-constructor reference paths

**Files:**
- Modify: `.claude/agents/entity-list-builder.md`
- Modify: `.claude/agents/dashboard-constructor.md`

- [ ] **Step 1: Update entity-list-builder to find spec in new location**

The `entity-list-constructor.md` was moved to `old_docs/`. Update the agent to look in `old_docs/central-implementation/Done/entity-list-constructor.md` or regenerate from the old_docs version.

- [ ] **Step 2: Update dashboard-constructor to find spec in new location**

The `Dashboard-Constructor.md` was moved to `old_docs/`. Same treatment.

- [ ] **Step 3: Commit**

```bash
cd OpenSea-API && git add ../.claude/agents/entity-list-builder.md ../.claude/agents/dashboard-constructor.md
git commit -m "fix: update agent reference paths after docs reorganization"
```

---

### Task 17: Create .gitkeep files for empty audit directories

**Files:**
- Create: Multiple `.gitkeep` files

- [ ] **Step 1: Add .gitkeep to all empty audit directories**

```bash
# API audit dirs
for dir in security performance standards data-integrity testing governance api-contract business-rules; do
  touch OpenSea-API/docs/audits/$dir/.gitkeep
done

# APP audit dirs
for dir in ui-ux accessibility design-system performance standards testing governance api-contract business-rules; do
  touch OpenSea-APP/docs/audits/$dir/.gitkeep
done

# Other empty dirs
touch OpenSea-API/docs/modules/.gitkeep
touch OpenSea-API/docs/patterns/.gitkeep
touch OpenSea-API/docs/guides/.gitkeep
touch OpenSea-API/docs/troubleshooting/.gitkeep
touch OpenSea-APP/docs/modules/.gitkeep
touch OpenSea-APP/docs/patterns/.gitkeep
touch OpenSea-APP/docs/guides/.gitkeep
touch OpenSea-APP/docs/troubleshooting/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add OpenSea-API/docs/ OpenSea-APP/docs/
git commit -m "chore: add .gitkeep files to empty docs directories"
```

---

## Implementation Notes

### Agent File Pattern (template for all audit agents)

Every audit agent follows this structure:

```markdown
---
name: audit-{dimension}
description: "Use this agent to audit {dimension} for a specific module..."
model: sonnet (or opus for business-rules)
color: {color}
---

You are a senior {dimension} specialist for the OpenSea project...

## Scope
{API only | APP only | Both repos}

## Criteria Checklist

| # | Criterion | How to Verify | Severity |
|---|-----------|---------------|----------|
| 1 | Description | Read X, check Y | critical/high/medium/low |

## Workflow

1. **Receive module name** (e.g., "stock")
2. **Read previous audit** (if exists) for Score History
3. **Read relevant source files** for the module
4. **Evaluate each criterion** — PASS, WARN, or FAIL with evidence
5. **Calculate score:** (PASS×1.0 + WARN×0.5) / total × 10
6. **Write report** to `docs/audits/{dimension}/YYYY-MM-DD-{module}.md`
7. **Return summary** with score and critical issues

## Report Format

(standard format from spec — see audit report template)

## Quality Rules

- NEVER mark PASS without evidence (cite file:line)
- NEVER mark FAIL without explaining what's wrong and how to fix
- ALWAYS compare with previous audit if one exists
- ALWAYS be specific — "line 45 of create-product.ts" not "some file"
```

### Parallel Execution

The audit-orchestrator dispatches agents using:
```
Agent tool with run_in_background: true
```
This allows parallel execution of all 11 agents simultaneously.

### Agent Memory

Only doc-writer gets persistent memory (tracks what was documented). Audit agents are stateless — their "memory" is the previous audit report file they read at the start.
