# Plano de Melhoria — Módulo HR

**Objetivo:** Elevar todas as 11 dimensões de auditoria para nota ≥ 9.0
**Nota atual:** 6.0/10 → **Alvo: 9.0/10**
**Data da auditoria:** 2026-03-10
**Relatórios:** `OpenSea-API/docs/audits/hr-*` e `OpenSea-APP/docs/audits/hr-*`
**Última verificação:** 2026-03-10 (cross-checked contra system-improvement-plan e codebase)

---

## Verificação Cruzada — Itens Já Feitos ou Incorretos

> Os seguintes ajustes foram aplicados após verificação do codebase real:

| Item Original                        | Status Real                                | Ação                       |
| ------------------------------------ | ------------------------------------------ | -------------------------- |
| 1.1 — 15 endpoints sem RBAC          | **11 confirmados** (time-bank já tem RBAC) | Corrigido no plano         |
| 1.2 — verifyTenant stakeholders      | **Controllers não existem**                | Removido do plano          |
| 1.4 — Remover enterprises.service.ts | **Usado pelo Finance** (não é morto)       | Removido do plano          |
| 3.2 — Prefixo v1 nos controllers     | **Já feito** (todos têm v1-)               | Removido do plano          |
| 3.4 — useUser.ts morto               | **Verificar uso real** antes de deletar    | Rebaixado para verificação |
| 4 erros domínio                      | **~20 use cases** (não 80+)                | Esforço reduzido           |

**Conflitos com system-improvement-plan.md (já concluído):**

- 2.3 Transactions → já implementado para Finance, padrão `TransactionManager` disponível para reuso
- 1.6 htmlFor → audit geral feito, mas HR stakeholder-modal não foi coberto
- 6.1 Error Boundaries → já implementados nos route groups
- 6.3 loading.tsx → já implementados em todas as pages

---

## Quadro de Notas — Atual vs Alvo

| #   | Dimensão       | Atual | Alvo | Delta | Fase |
| --- | -------------- | ----- | ---- | ----- | ---- |
| 1   | Accessibility  | 4.4   | 9.0  | +4.6  | 4    |
| 2   | Performance    | 4.5   | 9.0  | +4.5  | 2    |
| 3   | Data Integrity | 5.0   | 9.0  | +4.0  | 1    |
| 4   | Standards      | 5.0   | 9.0  | +4.0  | 3    |
| 5   | API Contract   | 6.0   | 9.0  | +3.0  | 1    |
| 6   | Responsiveness | 6.5   | 9.0  | +2.5  | 5    |
| 7   | Security       | 6.7   | 9.0  | +2.3  | 1    |
| 8   | UI/UX          | 6.9   | 9.0  | +2.1  | 4    |
| 9   | Business Rules | 7.0   | 9.0  | +2.0  | 6    |
| 10  | Testing        | 7.0   | 9.0  | +2.0  | 3    |
| 11  | Design System  | 7.5   | 9.0  | +1.5  | 5    |

---

## Visão Geral das Fases

| Fase  | Foco                                        | Impacto         | Dimensões                              |
| ----- | ------------------------------------------- | --------------- | -------------------------------------- |
| **1** | Segurança & Contratos (Quick Wins Críticos) | +3.0 nota geral | Security, API Contract, Data Integrity |
| **2** | Performance Backend & Frontend              | +1.5 nota geral | Performance                            |
| **3** | Padronização & Testes                       | +1.0 nota geral | Standards, Testing                     |
| **4** | Acessibilidade & UX                         | +1.5 nota geral | Accessibility, UI/UX                   |
| **5** | Responsividade & Design System              | +0.8 nota geral | Responsiveness, Design System          |
| **6** | Regras de Negócio & Domínio                 | +0.7 nota geral | Business Rules                         |

---

## Fase 1 — Segurança & Contratos (CRÍTICO — Fazer Primeiro)

> Corrige vulnerabilidades de segurança, vazamentos multi-tenant e bugs de contrato API.
> **Impacto:** Security 6.7→9.0, API Contract 6.0→9.0, Data Integrity 5.0→7.5

### 1.1 — Adicionar RBAC aos 15 endpoints desprotegidos (Security FAIL)

**Severidade:** CRÍTICA
**Esforço:** 2h

Endpoints sem `createPermissionMiddleware` (11 confirmados — time-bank já está protegido):

```
POST /v1/hr/time-control/clock-in
POST /v1/hr/time-control/clock-out
GET  /v1/hr/time-control/entries
GET  /v1/hr/time-control/calculate-hours
PATCH /v1/hr/vacation-periods/:id/schedule
PATCH /v1/hr/vacation-periods/:id/cancel
PATCH /v1/hr/vacation-periods/:id/start
PATCH /v1/hr/vacation-periods/:id/complete
PATCH /v1/hr/vacation-periods/:id/sell
POST /v1/hr/employees/check-cpf
POST /v1/hr/companies/check-cnpj
```

> **Nota:** Time-bank endpoints (credit, debit, adjust) JÁ possuem `PermissionCodes.HR.TIME_BANK.MANAGE`.

**Ação:** Adicionar `verifyPermission('hr.<resource>.<action>')` em cada controller. Verificar se os permission codes existem em `permission-codes.ts`; criar os que faltam.

---

### ~~1.2 — Adicionar verifyTenant nos stakeholder controllers~~ (REMOVIDO)

> **Verificação:** Os controllers de stakeholder ainda não foram implementados. Este item é inválido.
> Quando forem criados, incluir `verifyTenant` desde o início.

---

### 1.2 — Redação de dados sensíveis na listagem (Security WARN — LGPD)

**Severidade:** ALTA
**Esforço:** 3h

O `employeeResponseSchema` expõe CPF, PIS, RG e dados bancários para qualquer leitor. Endpoints de listagem devem retornar versão reduzida.

**Ação:**

1. Criar `employeeSummaryResponseSchema` sem campos sensíveis
2. Usar na resposta do `GET /v1/hr/employees` (listagem)
3. Manter `employeeResponseSchema` completo apenas no `GET /v1/hr/employees/:id` (detalhe)
4. Opcionalmente: mascarar CPF como `***.***.***-XX` na listagem

---

### ~~1.4 — Remover enterprises.service.ts duplicado~~ (RECLASSIFICADO)

> **Verificação:** O arquivo `enterprises.service.ts` é ATIVAMENTE usado pelo módulo Finance
> (bank-accounts create-modal, finance/companies API wrappers). NÃO é código morto.
> O problema real é que ele usa PUT em vez de PATCH — corrigir o método HTTP, não deletar.

**Severidade:** ALTA
**Esforço:** 30min

**Ação:** Corrigir `enterprises.service.ts` para usar `apiClient.patch()` em vez de `apiClient.put()`.

---

### 1.5 — Corrigir z.date() no company-fiscal-settings.schema.ts (API Contract CRÍTICO)

**Severidade:** CRÍTICA
**Esforço:** 15min

**Arquivo:** `OpenSea-API/src/http/schemas/hr/companies/company-fiscal-settings.schema.ts`

`createdAt`, `updatedAt`, `deletedAt`, `certificateA1ExpiresAt` usam `z.date()` (objeto Date nativo) em vez de `dateSchema` (string ISO). Isso pode quebrar serialização JSON.

**Ação:** Substituir `z.date()` por `dateSchema` importado de `common.schema.ts`.

---

### 1.6 — Corrigir campos desalinhados no CompanyStakeholder (API Contract CRÍTICO)

**Severidade:** ALTA
**Esforço:** 1h

**Arquivo:** `OpenSea-APP/src/types/hr/company.types.ts`

| Frontend       | Backend         | Ação                 |
| -------------- | --------------- | -------------------- |
| `entranceDate` | `entryDate`     | Renomear no frontend |
| `email`        | (não existe)    | Remover do tipo      |
| `phone`        | (não existe)    | Remover do tipo      |
| (ausente)      | `source`        | Adicionar ao tipo    |
| (ausente)      | `rawPayloadRef` | Adicionar ao tipo    |

---

### 1.7 — Remover tenantId dos 7 tipos de resposta (API Contract WARN)

**Severidade:** BAIXA
**Esforço:** 30min

Remover `tenantId: string` dos tipos: `Bonus`, `Deduction`, `Overtime`, `Absence`, `Payroll`, `VacationPeriod`, `TimeBank` no frontend. O campo não consta no DTO da API.

---

### 1.8 — Adicionar TransactionManager nas operações multi-step (Data Integrity FAIL)

**Severidade:** CRÍTICA
**Esforço:** 4h

Três use cases precisam de transação:

1. **`create-employee-with-user.ts`** — 5 etapas (criar User → setForceReset → associar tenant → criar Employee → atribuir grupo). Falha na etapa 4 deixa User órfão com acesso ao sistema.

2. **`calculate-payroll.ts`** — Cria múltiplos PayrollItem por funcionário. Falha parcial gera folha incompleta + duplicação no reprocessamento.

3. **`process-payroll-payment.ts`** — Atualiza bônus/deduções individualmente. Falha parcial deixa estado inconsistente.

**Ação:** Injetar `TransactionManager` via factory (padrão já existe em Finance), envolver em `transactionManager.execute()`.

---

### 1.9 — Corrigir race condition no TimeBank (Data Integrity FAIL)

**Severidade:** ALTA
**Esforço:** 2h

`CreditTimeBankUseCase`, `DebitTimeBankUseCase`, `AdjustTimeBankUseCase` fazem read-modify-write sem lock. Duas requisições simultâneas podem sobrescrever saldo.

**Ação:** Usar `SELECT ... FOR UPDATE` via Prisma raw query ou usar versão otimista com campo `version` + retry.

---

### 1.10 — Adicionar tenantId ao findById do BaseOrganizationRepository (Data Integrity WARN)

**Severidade:** ALTA
**Esforço:** 1h

`PrismaBaseOrganizationRepository.findById()` não filtra por `tenantId`. Um usuário com UUID de outro tenant pode acessar dados.

**Ação:** Alterar `findById(id)` para `findById(id, tenantId)` em `PrismaBaseOrganizationRepository`, `PrismaSuppliersRepository`, `PrismaManufacturersRepository`.

---

## Fase 2 — Performance Backend & Frontend

> Resolve paginação in-memory, N+1, cache e imports.
> **Impacto:** Performance 4.5→9.0

### 2.1 — Mover paginação para o banco de dados (Performance FAIL)

**Severidade:** CRÍTICA
**Esforço:** 6h

6 endpoints fazem `findAll()` + `.slice()` em memória. O pior caso é `ListEmployeesUseCase` que decripta CPF/PIS/conta bancária de TODOS os funcionários antes de fatiar.

**Ação para cada endpoint:**

1. Adicionar `skip` e `take` ao Prisma `findMany`
2. Adicionar `count()` separado para o `meta.total`
3. Mover filtros para `where` clause do Prisma
4. Remover `.slice()` do use case

**Endpoints afetados:**

- `ListEmployeesUseCase` (mais crítico — decriptação)
- `ListBonusesController` (sem meta de paginação)
- `ListDeductionsController` (sem meta de paginação)
- `ListAbsencesUseCase`
- `ListOvertimeUseCase`
- `ListVacationPeriodsUseCase`

---

### 2.2 — Corrigir createMany sequencial no PayrollItems (Performance FAIL)

**Severidade:** ALTA
**Esforço:** 1h

`PrismaPayrollItemsRepository.createMany` executa INSERT sequencial num `for` loop. Com 50 funcionários × 10 itens = 500 queries.

**Ação:** Usar `prisma.payrollItem.createMany({ data: [...] })` ou `prisma.$transaction([...creates])`.

---

### 2.3 — Adicionar dynamic imports nos modais (Performance FAIL)

**Severidade:** MÉDIA
**Esforço:** 2h

Todos os modais HR são importados estaticamente. Isso infla o bundle inicial.

**Ação:** Usar `next/dynamic` para todos os modais:

```typescript
const CreateEmployeeModal = dynamic(() => import("./modals/create-modal"), {
  ssr: false,
});
```

Aplicar em todas as páginas do módulo HR (~15 modais).

---

### 2.4 — Adicionar React.memo em componentes de lista (Performance FAIL)

**Severidade:** BAIXA
**Esforço:** 1h

Cards de listagem re-renderizam desnecessariamente em filtros/paginação.

**Ação:** Envolver componentes de card/row com `React.memo()`.

---

### 2.5 — Adicionar cache Redis nos endpoints de leitura (Performance FAIL)

**Severidade:** MÉDIA
**Esforço:** 3h

Nenhum endpoint HR usa cache Redis. Endpoints de leitura frequente devem ter cache com TTL curto.

**Ação:** Usar `RedisCacheService` (já existe) para:

- `GET /v1/hr/departments` — TTL 5min (muda raramente)
- `GET /v1/hr/positions` — TTL 5min
- `GET /v1/hr/work-schedules` — TTL 5min
- `GET /v1/hr/companies` — TTL 5min

---

## Fase 3 — Padronização & Testes

> Corrige erros de domínio, naming e adiciona testes multi-tenant.
> **Impacto:** Standards 5.0→9.0, Testing 7.0→9.0

### 3.1 — Substituir ~20 throw new Error() por classes de domínio (Standards FAIL)

**Severidade:** ALTA
**Esforço:** 3h

> **Verificação:** O número real é ~20 use cases (não 80+). Alguns já usam `ResourceNotFoundError`
> corretamente (calculate-vacation-balance, get-absence, bonuses/\*). Os restantes usam `throw new Error()`.

**Ação:**

1. Grep por `throw new Error` em `src/use-cases/hr/`
2. Substituir por classes de domínio importadas de `src/@errors/`
3. Remover `error.message.includes()` dos controllers
4. Usar `instanceof` pattern

---

### ~~3.2 — Adicionar prefixo v1 aos controllers~~ (JÁ FEITO ✅)

> **Verificação:** Todos os 31+ controller files em HR já seguem a convenção `v1-*.controller.ts`.

---

### 3.2 — Criar repositórios in-memory faltantes (Standards WARN)

**Severidade:** MÉDIA
**Esforço:** 3h

5 entidades sem `in-memory` repository. Necessários para testes unitários.

**Ação:** Criar para cada entidade seguindo o padrão existente.

---

### 3.3 — Remover código morto (Standards WARN)

**Severidade:** BAIXA
**Esforço:** 30min

- ~~Deletar `enterprises.service.ts`~~ — NÃO é morto, usado pelo Finance (ver 1.4)
- Verificar `OpenSea-APP/src/hooks/useUser.ts` — confirmar se é usado antes de deletar
- Deletar `OpenSea-API/src/http/controllers/hr/employees/temp.txt` (34KB de rascunho E2E)
- Limpar barrel `src/http/schemas/hr.schema` depreciado

---

### 3.5 — Adicionar testes de isolamento multi-tenant (Testing FAIL)

**Severidade:** ALTA
**Esforço:** 4h

Zero testes verificam que dados do Tenant A são invisíveis para Tenant B. O módulo Email tem 15 desses testes.

**Ação:** Criar `v1-hr-multi-tenant-isolation.e2e.spec.ts` com cenários:

- Listar funcionários: Tenant A não vê Tenant B
- Buscar por ID: 404 se ID pertence a outro tenant
- Atualizar: 404 se ID pertence a outro tenant
- Deletar: 404 se ID pertence a outro tenant
- Repetir para: employees, departments, companies, payroll

---

### 3.6 — Expandir testes unitários mínimos (Testing WARN)

**Severidade:** MÉDIA
**Esforço:** 3h

3 spec files com apenas 1 teste:

- `calculate-vacation-balance.spec.ts` — adicionar: saldo negativo, período parcial, múltiplas ausências
- `get-my-employee.spec.ts` — adicionar: employee não encontrado, tenant errado
- `process-payroll-payment.spec.ts` — adicionar: pagamento parcial, folha não aprovada, idempotência

---

### 3.7 — Corrigir Date.now() em testes E2E (Testing WARN)

**Severidade:** BAIXA
**Esforço:** 1h

5 arquivos de payroll E2E usam `(Date.now() % 12) + 1` para gerar mês/ano, criando risco de colisão.

**Ação:** Usar `faker.number.int({ min: 1, max: 12 })` com seed ou timestamp único.

---

## Fase 4 — Acessibilidade & UX

> Corrige WCAG AA, aria-labels, confirmações e textos PT-BR.
> **Impacto:** Accessibility 4.4→9.0, UI/UX 6.9→9.0

### 4.1 — Adicionar aria-label em botões de ícone (Accessibility FAIL)

**Severidade:** CRÍTICA
**Esforço:** 3h

Botões de fechar, editar, mostrar senha em 7+ modais não têm `aria-label`. Screen readers leem apenas "botão".

**Ação:** Grep por `<Button` + ícone sem `aria-label` em `src/app/(dashboard)/(modules)/hr/`. Adicionar `aria-label="Fechar"`, `aria-label="Editar"`, etc.

---

### 4.2 — Adicionar htmlFor em labels desvinculados (Accessibility FAIL)

**Severidade:** ALTA
**Esforço:** 1h

- `stakeholder-modal.tsx`: 8 campos sem `htmlFor`
- Todos os modais com `EmployeeSelector`: `<Label>` sem `htmlFor`

**Ação:** Adicionar `id` nos inputs e `htmlFor` nos labels correspondentes.

---

### 4.3 — Tornar cards de seleção acessíveis por teclado (Accessibility WARN)

**Severidade:** ALTA
**Esforço:** 1h

Cards de seleção de empresa em `create-modal.tsx` são `<div onClick>` — não respondem a Enter/Space.

**Ação:** Trocar para `<button>` ou adicionar `role="button"`, `tabIndex={0}`, `onKeyDown`.

---

### 4.4 — Adicionar focus-visible:ring nos botões (Accessibility WARN)

**Severidade:** MÉDIA
**Esforço:** 1h

O componente `Button` usa `outline-none` sem `focus-visible:ring-*`. Usuários de teclado não veem indicador de foco.

**Ação:** Adicionar `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` ao componente Button base.

---

### 4.5 — Substituir window.confirm() por ConfirmDialog (UI/UX FAIL)

**Severidade:** ALTA
**Esforço:** 1h

Páginas de detalhe de departamento e escala de trabalho usam `window.confirm()` nativo.

**Ação:** Substituir por `DeleteConfirmModal` ou `ConfirmDialog` do shadcn/ui.

---

### 4.6 — Implementar handleDelete nas páginas de detalhe (UI/UX FAIL)

**Severidade:** ALTA
**Esforço:** 2h

Botões "Excluir" em funcionário, cargo e empresa não fazem nada (redirecionam sem deletar). Funcionário tem `// TODO: Implement delete`.

**Ação:** Implementar com `ConfirmDialog` → mutation → redirect.

---

### 4.7 — Adicionar confirmação em ações de payroll/absences (UI/UX FAIL)

**Severidade:** ALTA
**Esforço:** 1h

"Cancelar" em folha de pagamento e ausências dispara imediatamente sem diálogo.

**Ação:** Adicionar `ConfirmDialog` antes de cancelar payroll/absence.

---

### 4.8 — Corrigir acentuação nos textos PT-BR (UI/UX WARN)

**Severidade:** MÉDIA
**Esforço:** 1h

Textos sem acentuação: "Funcionarios", "organizacao", "Matricula", "Codigo", "(copia)", "Novo Funcionario".

**Ação:** Grep e corrigir todos os textos visíveis ao usuário.

---

### 4.9 — Adicionar validação inline no formulário de edição de employee (UI/UX WARN)

**Severidade:** MÉDIA
**Esforço:** 1h

`/hr/employees/[id]/edit` falha silenciosamente quando campos obrigatórios estão vazios.

**Ação:** Adicionar validação Zod com react-hook-form ou mostrar mensagens de erro inline.

---

## Fase 5 — Responsividade & Design System

> Corrige overflow mobile, tabs e cores hardcoded.
> **Impacto:** Responsiveness 6.5→9.0, Design System 7.5→9.0

### 5.1 — Substituir larguras fixas por responsivas nos filtros (Responsiveness FAIL)

**Severidade:** CRÍTICA
**Esforço:** 2h

`w-64`, `w-52`, `w-44`, `w-[160px]` nos filtros causam overflow horizontal em 320px.

**Ação:** Substituir por `w-full sm:w-64`, `w-full sm:w-52`, etc. Afeta:

- `/hr/employees`, `/hr/absences`, `/hr/overtime`, `/hr/vacations`, `/hr/payroll`
- `EmployeeSelector` wrapper e `SelectTrigger`

---

### 5.2 — Colapsar Identity Card em mobile (Responsiveness WARN)

**Severidade:** ALTA
**Esforço:** 1h

Páginas de detalhe usam `flex items-start gap-5` sem breakpoint.

**Ação:** Mudar para `flex flex-col sm:flex-row items-start gap-5`.

---

### 5.3 — Corrigir TabsList com grid-cols-5 fixo (Responsiveness WARN)

**Severidade:** ALTA
**Esforço:** 30min

5 abas comprimidas a 64px cada em 320px — ilegíveis.

**Ação:** Usar `overflow-x-auto` no TabsList ou `grid-cols-3 sm:grid-cols-5`.

---

### 5.4 — Colapsar Header em mobile (Responsiveness WARN)

**Severidade:** MÉDIA
**Esforço:** 30min

`Header` com `flex-row` sem breakpoint. Título longo + botões se comprimem.

**Ação:** `flex flex-col sm:flex-row gap-2 sm:gap-0`.

---

### 5.5 — Extrair cores de gráficos para constante compartilhada (Design System FAIL)

**Severidade:** MÉDIA
**Esforço:** 1h

`overview/page.tsx` tem 14 valores hex hardcoded nos gráficos Recharts.

**Ação:** Criar `src/lib/chart-colors.ts` com paleta nomeada, importar nos gráficos.

---

### 5.6 — Substituir window.confirm() por DeleteConfirmModal (Design System WARN)

**Severidade:** ALTA (já coberto em 4.5)

---

### 5.7 — Usar variantes semânticas nos botões de ação (Design System WARN)

**Severidade:** BAIXA
**Esforço:** 1h

`text-blue-600`, `text-emerald-600`, `text-red-600` inline em vez de variantes semânticas.

**Ação:** Substituir por `text-primary`, `text-success`, `text-destructive` ou criar variantes no Button.

---

### 5.8 — Corrigir bg-gradient-to-br legado (Design System WARN)

**Severidade:** BAIXA
**Esforço:** 15min

`absences/page.tsx` usa `bg-gradient-to-br` (Tailwind v3) em vez de `bg-linear-to-br` (Tailwind v4).

---

## Fase 6 — Regras de Negócio & Domínio

> Corrige bounded contexts, implementa reports e adiciona audit logging.
> **Impacto:** Business Rules 7.0→9.0

### 6.1 — Avaliar migração de bounded context (Business Rules FAIL)

**Severidade:** ALTA
**Esforço:** 8h (planejamento) + implementação separada

Suppliers, Manufacturers e Company/\* (~35% das entidades) estão no módulo HR mas pertencem a um bounded context "Cadastros" ou "Core".

**Decisão (2026-03-10):**
- **Manufacturers** → mover para `stock/` (fazem parte do cadastro de produtos)
- **Suppliers** → mover para `finance/` (fazem parte do fluxo financeiro)
- **Company/\*** → manter em HR por enquanto (forte acoplamento com employees/payroll)

**Ação (planejamento):**

1. Mapear todas as dependências de/para essas entidades
2. ~~Decidir: módulo próprio (`organization/`) ou mover para `core/`~~ Decidido acima
3. Criar ADR documentando a decisão
4. Planejar migração incremental (controllers → use cases → repositories → prisma)

> **Nota:** Esta é uma refatoração estrutural grande. Considerar fazer após todas as outras fases.

---

### 6.2 — Implementar endpoints de relatório (Business Rules FAIL)

**Severidade:** ALTA
**Esforço:** 6h

7 permission codes para relatórios existem mas zero endpoints:

- `hr.reports.employees`
- `hr.reports.payroll`
- `hr.reports.absences`
- `hr.reports.overtime`
- `hr.reports.time-bank`
- `hr.reports.vacations`
- `hr.reports.departments`

**Ação:** Implementar pelo menos 3 endpoints prioritários:

1. `GET /v1/hr/reports/employees` — listagem com filtros avançados + export CSV
2. `GET /v1/hr/reports/payroll` — resumo de folha com totais por departamento
3. `GET /v1/hr/reports/absences` — relatório de ausências com calendário

---

### 6.3 — Adicionar audit logging nos controllers HR (Business Rules FAIL)

**Severidade:** ALTA
**Esforço:** 3h

Nenhum controller HR gera registros de auditoria. Módulos Finance e Email já usam `queueAuditLog()`.

**Ação:** Adicionar `queueAuditLog()` nos controllers de:

- CRUD de funcionários (create, update, delete, status change)
- Operações de folha (calculate, approve, process payment)
- Aprovação/rejeição de ausências e horas extras
- CRUD de empresas

---

### 6.4 — Corrigir EmployeeStatus.canWork() (Business Rules — Bug)

**Severidade:** MÉDIA
**Esforço:** 15min

`canWork()` retorna `true` para `ON_LEAVE`, que é semanticamente incorreto.

**Ação:** Remover `ON_LEAVE` do array de status que retornam `true` em `canWork()`.

---

### 6.5 — Corrigir Overtime.reject() (Business Rules — Bug)

**Severidade:** MÉDIA
**Esforço:** 30min

`reject()` não persiste estado de rejeição.

**Ação:** Atualizar `status` para `REJECTED` e salvar `rejectedAt` + `rejectedBy`.

---

### 6.6 — Externalizar tabelas INSS/IRRF (Business Rules WARN)

**Severidade:** MÉDIA
**Esforço:** 2h

Tabelas de alíquotas 2024 hardcoded no código. Precisam ser atualizadas anualmente.

**Ação:** Mover para `src/constants/hr/tax-tables.ts` com estrutura versionada por ano, ou para tabela no banco com CRUD admin.

---

### 6.7 — Implementar máquinas de estado completas (Business Rules WARN)

**Severidade:** BAIXA
**Esforço:** 3h

- `EmployeeStatus`: criar use cases de transição (activate, suspend, terminate, retire)
- `VacationPeriod`: adicionar expiração automática

---

## Ordem de Execução Recomendada

```
Fase 1 (Segurança & Contratos)     ██████████ PRIMEIRO — vulnerabilidades ativas
  └─ 1.1-1.10 (~14h)

Fase 2 (Performance)               ████████ SEGUNDO — impacto em produção
  └─ 2.1-2.5 (~13h)

Fase 3 (Padronização & Testes)     ██████ TERCEIRO — qualidade de código
  └─ 3.1-3.7 (~20h)

Fase 4 (Acessibilidade & UX)       ██████ QUARTO — experiência do usuário
  └─ 4.1-4.9 (~12h)

Fase 5 (Responsividade & Design)   ████ QUINTO — polish visual
  └─ 5.1-5.8 (~6h)

Fase 6 (Regras de Negócio)         ████████ SEXTO — evolução funcional
  └─ 6.1-6.7 (~26h)
```

**Esforço total estimado:** ~78h (ajustado após verificação — itens removidos e esforço reduzido)

---

## Checklist de Re-auditoria

Após completar cada fase, rodar os agentes de auditoria correspondentes para validar a nota:

| Fase | Agentes para re-auditar                                  |
| ---- | -------------------------------------------------------- |
| 1    | audit-security, audit-api-contract, audit-data-integrity |
| 2    | audit-performance                                        |
| 3    | audit-standards, audit-testing                           |
| 4    | audit-accessibility, audit-ui-ux                         |
| 5    | audit-responsiveness, audit-design-system                |
| 6    | audit-business-rules                                     |
