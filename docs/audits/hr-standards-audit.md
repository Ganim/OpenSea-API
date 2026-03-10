# Auditoria de Padronização — Módulo HR

**Data:** 2026-03-10
**Repositórios auditados:** OpenSea-API · OpenSea-APP
**Escopo:** employees, departments, positions, companies, work-schedules, absences, payroll (bonuses, deductions), overtime, suppliers, manufacturers
**Auditor:** Claude Sonnet 4.6

---

## Sumário Executivo

| Critério                                                       | Status | Peso     |
| -------------------------------------------------------------- | ------ | -------- |
| 1 — Nomenclatura de arquivos (kebab-case)                      | WARN   | medium   |
| 2 — Nomenclatura de classes/componentes (PascalCase)           | WARN   | medium   |
| 3 — Path aliases consistentes (`@/`)                           | PASS   | low      |
| 4 — Clean Architecture (sem violações de camada)               | PASS   | critical |
| 5 — Padrão Repository (interface + Prisma + in-memory)         | WARN   | high     |
| 6 — Padrão Use Case (responsabilidade única, Request/Response) | WARN   | high     |
| 7 — Padrão Factory (`make-*.ts`)                               | WARN   | medium   |
| 8 — Padrão Mapper (conversões via mappers dedicados)           | WARN   | medium   |
| 9 — Tratamento de erros com classes de domínio específicas     | FAIL   | high     |
| 10 — Ausência de código morto                                  | WARN   | low      |

**Pontuação:**

```
PASS  = 1 critério × 1,0  =  1,0
WARN  = 8 critérios × 0,5 =  4,0
FAIL  = 1 critério × 0,0  =  0,0
─────────────────────────────────
Total = 5,0 / 10,0 → Score: 5,0
```

> **Diagnóstico geral:** O módulo HR apresenta uma base arquitetural sólida — Clean Architecture, Repository Pattern, Use Case Pattern e Factory Pattern todos presentes. No entanto, existe uma violação sistemática e crítica no tratamento de erros, onde `throw new Error()` genérico é usado em vez de classes de erro de domínio específicas. Adicionalmente, há inconsistências moderadas de nomenclatura de funções de controllers e código morto relevante no frontend.

---

## Critério 1 — Nomenclatura de Arquivos (kebab-case)

**Status: WARN**

A grande maioria dos arquivos segue kebab-case corretamente. O desvio identificado é pontual e exclusivo do frontend.

### Violações detectadas

**OpenSea-APP:**

| Arquivo                                                     | Problema                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `D:\Code\Projetos\OpenSea\OpenSea-APP\src\hooks\useUser.ts` | Usa camelCase em vez de `use-user.ts`. Todos os outros hooks do projeto seguem `use-*.ts`. |

**Por que importa:** A inconsistência quebra a busca por padrão e dificulta ferramentas de geração automática de índices. O padrão kebab-case garante compatibilidade entre sistemas de arquivos case-insensitive (Windows/macOS) e case-sensitive (Linux/CI).

---

## Critério 2 — Nomenclatura de Classes e Funções Exportadas (PascalCase / camelCase)

**Status: WARN**

Os nomes de classes de Use Cases, Entities e Repositories estão corretos. O desvio encontra-se nas **funções de controller exportadas**, onde existe inconsistência sistêmica: algumas seguem o padrão `v1XxxYyyController` e outras omitem o prefixo `v1`.

### Padrão esperado (documentado em CLAUDE.md)

```typescript
export async function v1CreateProductController(app: FastifyInstance) { ... }
```

### Violações detectadas — funções sem prefixo `v1`

**OpenSea-API — `src/http/controllers/hr/`:**

| Arquivo                                                                   | Função exportada (incorreta)            | Forma correta esperada                              |
| ------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------- |
| `absences/v1-approve-absence.controller.ts`                               | `approveAbsenceController`              | `v1ApproveAbsenceController`                        |
| `absences/v1-cancel-absence.controller.ts`                                | `cancelAbsenceController`               | `v1CancelAbsenceController`                         |
| `absences/v1-get-absence.controller.ts`                                   | `getAbsenceController`                  | `v1GetAbsenceController`                            |
| `absences/v1-get-vacation-balance.controller.ts`                          | `getVacationBalanceController`          | `v1GetVacationBalanceController`                    |
| `absences/v1-list-absences.controller.ts`                                 | `listAbsencesController`                | `v1ListAbsencesController`                          |
| `absences/v1-reject-absence.controller.ts`                                | `rejectAbsenceController`               | `v1RejectAbsenceController`                         |
| `absences/v1-request-sick-leave.controller.ts`                            | `requestSickLeaveController`            | `v1RequestSickLeaveController`                      |
| `absences/v1-request-vacation.controller.ts`                              | `requestVacationController`             | `v1RequestVacationController`                       |
| `bonuses/v1-create-bonus.controller.ts`                                   | `createBonusController`                 | `v1CreateBonusController`                           |
| `bonuses/v1-delete-bonus.controller.ts`                                   | `deleteBonusController`                 | `v1DeleteBonusController`                           |
| `bonuses/v1-get-bonus.controller.ts`                                      | `getBonusController`                    | `v1GetBonusController`                              |
| `bonuses/v1-list-bonuses.controller.ts`                                   | `listBonusesController`                 | `v1ListBonusesController`                           |
| `company-addresses/v1-create-company-address.controller.ts`               | `createCompanyAddressController`        | `v1CreateCompanyAddressController`                  |
| `company-addresses/v1-list-company-addresses.controller.ts`               | `listCompanyAddressesController`        | `v1ListCompanyAddressesController`                  |
| `company-addresses/v1-update-company-address.controller.ts`               | `updateCompanyAddressController`        | `v1UpdateCompanyAddressController`                  |
| `company-addresses/v1-delete-company-address.controller.ts`               | `deleteCompanyAddressController`        | `v1DeleteCompanyAddressController`                  |
| `company-cnaes/v1-create-company-cnae.controller.ts`                      | `createCompanyCnaeController`           | `v1CreateCompanyCnaeController`                     |
| `company-cnaes/v1-list-company-cnaes.controller.ts`                       | `listCompanyCnaesController`            | `v1ListCompanyCnaesController`                      |
| `company-cnaes/v1-update-company-cnae.controller.ts`                      | `updateCompanyCnaeController`           | `v1UpdateCompanyCnaeController`                     |
| `company-cnaes/v1-get-primary-company-cnae.controller.ts`                 | `getPrimaryCompanyCnaeController`       | `v1GetPrimaryCompanyCnaeController`                 |
| `company-cnaes/v1-delete-company-cnae.controller.ts`                      | `deleteCompanyCnaeController`           | `v1DeleteCompanyCnaeController`                     |
| `company-fiscal-settings/v1-create-company-fiscal-settings.controller.ts` | `createCompanyFiscalSettingsController` | `v1CreateCompanyFiscalSettingsController`           |
| `company-fiscal-settings/v1-get-company-fiscal-settings.controller.ts`    | `getCompanyFiscalSettingsController`    | `v1GetCompanyFiscalSettingsController`              |
| `company-fiscal-settings/v1-update-company-fiscal-settings.controller.ts` | `updateCompanyFiscalSettingsController` | `v1UpdateCompanyFiscalSettingsController`           |
| `company-fiscal-settings/v1-delete-company-fiscal-settings.controller.ts` | `deleteCompanyFiscalSettingsController` | `v1DeleteCompanyFiscalSettingsController`           |
| `company-stakeholder/v1-create-company-stakeholder.controller.ts`         | `v1CreateCompanyStakeholder`            | `v1CreateCompanyStakeholderController` (sem sufixo) |
| `company-stakeholder/v1-delete-company-stakeholder.controller.ts`         | `v1DeleteCompanyStakeholder`            | `v1DeleteCompanyStakeholderController` (sem sufixo) |
| `company-stakeholder/v1-get-company-stakeholders.controller.ts`           | `v1GetCompanyStakeholders`              | `v1GetCompanyStakeholdersController` (sem sufixo)   |
| `company-stakeholder/v1-update-company-stakeholder.controller.ts`         | `v1UpdateCompanyStakeholder`            | `v1UpdateCompanyStakeholderController` (sem sufixo) |
| `deductions/v1-create-deduction.controller.ts`                            | `createDeductionController`             | `v1CreateDeductionController`                       |
| `deductions/v1-get-deduction.controller.ts`                               | `getDeductionController`                | `v1GetDeductionController`                          |
| `deductions/v1-list-deductions.controller.ts`                             | `listDeductionsController`              | `v1ListDeductionsController`                        |
| `deductions/v1-delete-deduction.controller.ts`                            | `deleteDeductionController`             | `v1DeleteDeductionController`                       |
| `departments/v1-create-department.controller.ts`                          | `createDepartmentController`            | `v1CreateDepartmentController`                      |
| `departments/v1-delete-department.controller.ts`                          | `deleteDepartmentController`            | `v1DeleteDepartmentController`                      |
| `departments/v1-get-department-by-id.controller.ts`                       | `getDepartmentByIdController`           | `v1GetDepartmentByIdController`                     |
| `departments/v1-list-departments.controller.ts`                           | `listDepartmentsController`             | `v1ListDepartmentsController`                       |
| `departments/v1-update-department.controller.ts`                          | `updateDepartmentController`            | `v1UpdateDepartmentController`                      |
| `employees/v1-check-cpf.controller.ts`                                    | `checkCpfController`                    | `v1CheckCpfController`                              |
| `employees/v1-create-employee.controller.ts`                              | `createEmployeeController`              | `v1CreateEmployeeController`                        |
| `employees/v1-create-employee-with-user.controller.ts`                    | `createEmployeeWithUserController`      | `v1CreateEmployeeWithUserController`                |
| `employees/v1-delete-employee.controller.ts`                              | `deleteEmployeeController`              | `v1DeleteEmployeeController`                        |
| `employees/v1-get-employee-by-id.controller.ts`                           | `getEmployeeByIdController`             | `v1GetEmployeeByIdController`                       |
| `employees/v1-get-employee-by-user-id.controller.ts`                      | `getEmployeeByUserIdController`         | `v1GetEmployeeByUserIdController`                   |
| `employees/v1-get-employees-label-data.controller.ts`                     | `getEmployeesLabelDataController`       | `v1GetEmployeesLabelDataController`                 |
| `employees/v1-link-user-to-employee.controller.ts`                        | `linkUserToEmployeeController`          | `v1LinkUserToEmployeeController`                    |
| `employees/v1-list-employees.controller.ts`                               | `listEmployeesController`               | `v1ListEmployeesController`                         |
| `employees/v1-terminate-employee.controller.ts`                           | `terminateEmployeeController`           | `v1TerminateEmployeeController`                     |
| `employees/v1-transfer-employee.controller.ts`                            | `transferEmployeeController`            | `v1TransferEmployeeController`                      |
| `employees/v1-unlink-user-from-employee.controller.ts`                    | `unlinkUserFromEmployeeController`      | `v1UnlinkUserFromEmployeeController`                |
| `employees/v1-upload-employee-photo.controller.ts`                        | `uploadEmployeePhotoController`         | `v1UploadEmployeePhotoController`                   |
| `employees/v1-delete-employee-photo.controller.ts`                        | `deleteEmployeePhotoController`         | `v1DeleteEmployeePhotoController`                   |
| `overtime/v1-approve-overtime.controller.ts`                              | `approveOvertimeController`             | `v1ApproveOvertimeController`                       |
| `overtime/v1-get-overtime.controller.ts`                                  | `getOvertimeController`                 | `v1GetOvertimeController`                           |
| `overtime/v1-list-overtime.controller.ts`                                 | `listOvertimeController`                | `v1ListOvertimeController`                          |
| `overtime/v1-request-overtime.controller.ts`                              | `requestOvertimeController`             | `v1RequestOvertimeController`                       |
| `payrolls/v1-approve-payroll.controller.ts`                               | `approvePayrollController`              | `v1ApprovePayrollController`                        |
| `payrolls/v1-calculate-payroll.controller.ts`                             | `calculatePayrollController`            | `v1CalculatePayrollController`                      |
| `payrolls/v1-cancel-payroll.controller.ts`                                | `cancelPayrollController`               | `v1CancelPayrollController`                         |
| `payrolls/v1-create-payroll.controller.ts`                                | `createPayrollController`               | `v1CreatePayrollController`                         |
| `payrolls/v1-get-payroll.controller.ts`                                   | `getPayrollController`                  | `v1GetPayrollController`                            |
| `payrolls/v1-list-payrolls.controller.ts`                                 | `listPayrollsController`                | `v1ListPayrollsController`                          |
| `payrolls/v1-pay-payroll.controller.ts`                                   | `payPayrollController`                  | `v1PayPayrollController`                            |
| `positions/v1-create-position.controller.ts`                              | `createPositionController`              | `v1CreatePositionController`                        |
| `positions/v1-delete-position.controller.ts`                              | `deletePositionController`              | `v1DeletePositionController`                        |
| `positions/v1-get-position-by-id.controller.ts`                           | `getPositionByIdController`             | `v1GetPositionByIdController`                       |
| `positions/v1-list-positions.controller.ts`                               | `listPositionsController`               | `v1ListPositionsController`                         |
| `positions/v1-update-position.controller.ts`                              | `updatePositionController`              | `v1UpdatePositionController`                        |
| `time-bank/v1-adjust-time-bank.controller.ts`                             | `adjustTimeBankController`              | `v1AdjustTimeBankController`                        |
| `time-bank/v1-credit-time-bank.controller.ts`                             | `creditTimeBankController`              | `v1CreditTimeBankController`                        |
| `time-bank/v1-debit-time-bank.controller.ts`                              | `debitTimeBankController`               | `v1DebitTimeBankController`                         |
| `time-bank/v1-get-time-bank.controller.ts`                                | `getTimeBankController`                 | `v1GetTimeBankController`                           |
| `time-bank/v1-list-time-banks.controller.ts`                              | `listTimeBanksController`               | `v1ListTimeBanksController`                         |
| `time-control/v1-calculate-worked-hours.controller.ts`                    | `calculateWorkedHoursController`        | `v1CalculateWorkedHoursController`                  |
| `time-control/v1-clock-in.controller.ts`                                  | `clockInController`                     | `v1ClockInController`                               |
| `time-control/v1-clock-out.controller.ts`                                 | `clockOutController`                    | `v1ClockOutController`                              |
| `time-control/v1-list-time-entries.controller.ts`                         | `listTimeEntriesController`             | `v1ListTimeEntriesController`                       |
| `vacation-periods/v1-cancel-scheduled-vacation.controller.ts`             | `cancelScheduledVacationController`     | `v1CancelScheduledVacationController`               |
| `vacation-periods/v1-complete-vacation.controller.ts`                     | `completeVacationController`            | `v1CompleteVacationController`                      |
| `vacation-periods/v1-create-vacation-period.controller.ts`                | `createVacationPeriodController`        | `v1CreateVacationPeriodController`                  |
| `vacation-periods/v1-get-vacation-period.controller.ts`                   | `getVacationPeriodController`           | `v1GetVacationPeriodController`                     |
| `vacation-periods/v1-list-vacation-periods.controller.ts`                 | `listVacationPeriodsController`         | `v1ListVacationPeriodsController`                   |
| `vacation-periods/v1-schedule-vacation.controller.ts`                     | `scheduleVacationController`            | `v1ScheduleVacationController`                      |
| `vacation-periods/v1-sell-vacation-days.controller.ts`                    | `sellVacationDaysController`            | `v1SellVacationDaysController`                      |
| `vacation-periods/v1-start-vacation.controller.ts`                        | `startVacationController`               | `v1StartVacationController`                         |
| `work-schedules/v1-create-work-schedule.controller.ts`                    | `createWorkScheduleController`          | `v1CreateWorkScheduleController`                    |
| `work-schedules/v1-delete-work-schedule.controller.ts`                    | `deleteWorkScheduleController`          | `v1DeleteWorkScheduleController`                    |
| `work-schedules/v1-get-work-schedule.controller.ts`                       | `getWorkScheduleController`             | `v1GetWorkScheduleController`                       |
| `work-schedules/v1-list-work-schedules.controller.ts`                     | `listWorkSchedulesController`           | `v1ListWorkSchedulesController`                     |
| `work-schedules/v1-update-work-schedule.controller.ts`                    | `updateWorkScheduleController`          | `v1UpdateWorkScheduleController`                    |

**Contexto:** O sub-módulo `companies/` segue o padrão corretamente (`v1CreateCompanyController`, `v1UpdateCompanyController`, etc.). O sub-módulo `suppliers/` e `manufacturers/` também segue. A inconsistência abrange todos os demais sub-módulos.

**Por que importa:** O prefixo `v1` no nome da função serve como sinalizador de versionamento que facilita a evolução da API (futura adição de `v2` controllers sem rename global). A inconsistência atual impossibilita buscas grep confiáveis por versão de controller.

---

## Critério 3 — Path Aliases Consistentes (`@/`)

**Status: PASS**

Todos os arquivos auditados utilizam `@/` corretamente. Não foi identificado nenhum import com caminhos relativos profundos (`../../..`). O alias está configurado em `tsconfig.json` e é aplicado de forma uniforme em ambos os repositórios.

---

## Critério 4 — Clean Architecture (sem violações de camada)

**Status: PASS**

Nenhuma violação de camada foi identificada:

- **Use Cases** (`src/use-cases/hr/`) não importam de controllers ou schemas HTTP. Importam apenas de `@/entities/hr/`, `@/repositories/hr/` e `@/services/`.
- **Entities** (`src/entities/hr/`) não importam de repositórios, use cases ou camada HTTP.
- **Repositories** (`src/repositories/hr/`) importam de `@/entities/hr/` (domínio) e `@prisma/generated/client`, nunca de use cases ou controllers.
- **Controllers** (`src/http/controllers/hr/`) importam de factories (`@/use-cases/hr/*/factories/`), mappers e schemas — nunca de Prisma diretamente.
- **Mappers** (`src/mappers/hr/`) fazem a conversão correta entre camadas sem criar dependências cruzadas indevidas.

---

## Critério 5 — Padrão Repository (interface + Prisma + in-memory)

**Status: WARN**

A maioria das entidades possui todas as três implementações exigidas. Foram identificadas as seguintes lacunas:

### Entidades sem implementação `in-memory`

| Entidade                  | Interface                                 | Prisma                                           | In-memory   |
| ------------------------- | ----------------------------------------- | ------------------------------------------------ | ----------- |
| `companies`               | `companies-repository.ts` ✓               | `prisma-companies-repository.ts` ✓               | **Ausente** |
| `company-addresses`       | `company-addresses-repository.ts` ✓       | `prisma-company-addresses-repository.ts` ✓       | **Ausente** |
| `company-cnaes`           | `company-cnaes-repository.ts` ✓           | `prisma-company-cnaes-repository.ts` ✓           | **Ausente** |
| `company-fiscal-settings` | `company-fiscal-settings-repository.ts` ✓ | `prisma-company-fiscal-settings-repository.ts` ✓ | **Ausente** |
| `company-stakeholder`     | `company-stakeholder-repository.ts` ✓     | `prisma-company-stakeholder-repository.ts` ✓     | **Ausente** |

**Entidade com base compartilhada:**

- `base-organization-repository.ts` e `prisma-base-organization-repository.ts` existem, mas não há implementação in-memory correspondente.

**Por que importa:** A ausência de repositórios in-memory impossibilita testes unitários isolados (sem banco de dados) para os use cases que dependem dessas entidades. Isso force o uso de testes E2E para validar lógicas de negócio simples, aumentando o tempo de feedback do desenvolvedor e a fragilidade dos testes.

---

## Critério 6 — Padrão Use Case (responsabilidade única, Request/Response)

**Status: WARN**

O padrão `Request`/`Response` é seguido corretamente na quase totalidade dos use cases. Foram identificados os seguintes problemas:

### 6.1 — Violação de responsabilidade única: lógica de mapeamento duplicada em Use Cases

Os use cases `CreateEmployeeUseCase` e `UpdateEmployeeUseCase` contém métodos privados `mapContractType()`, `mapWorkRegime()` e `computePendingIssues()` **duplicados** entre si:

- `D:\Code\Projetos\OpenSea\OpenSea-API\src\use-cases\hr\employees\create-employee.ts` — linhas 288–358
- `D:\Code\Projetos\OpenSea\OpenSea-API\src\use-cases\hr\employees\update-employee.ts` — linhas 441–511

**Por que importa:** A duplicação viola o princípio DRY e cria risco de divergência: se a lógica de mapeamento de `ContractType` mudar, precisa ser atualizada em dois lugares. Esses utilitários pertencem a um helper ou serviço de domínio compartilhado.

### 6.2 — `factories/index.ts` do sub-módulo `employees` incompleto

O arquivo `src/use-cases/hr/employees/factories/index.ts` não exporta quatro factories que existem no diretório:

- `make-check-employee-cpf-use-case.ts` — **não exportado**
- `make-delete-employee-use-case.ts` — **não exportado**
- `make-get-my-employee-use-case.ts` — **não exportado**
- `make-create-employee-with-user-use-case.ts` — **não exportado**

Esses factories são usados diretamente pelos controllers via importação individual, contornando o barrel export.

### 6.3 — Use Case `compute-pending-issues.ts` fora do contexto adequado

O arquivo `src/use-cases/hr/company-cnaes/compute-pending-issues.ts` contém uma função utilitária standalone que não é um use case (não possui classe, não tem `Request`/`Response`). Esse padrão foge da estrutura esperada do diretório `use-cases/`.

---

## Critério 7 — Padrão Factory (`make-*.ts`)

**Status: WARN**

A maioria dos use cases possui factory correspondente. Foram identificados dois desvios de padrão:

### 7.1 — Factories com múltiplos use cases em um único arquivo

Os seguintes arquivos agrupam múltiplas factories em um único arquivo em vez de seguir o padrão `make-{use-case}-use-case.ts` individual:

| Arquivo                                                                              | Use Cases agrupados                                                               |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `src/use-cases/hr/suppliers/factories/make-suppliers.ts`                             | Create, Get, List, Update, Delete (5 factories)                                   |
| `src/use-cases/hr/manufacturers/factories/make-manufacturers.ts`                     | Create, Get, List, Update, Delete (5 factories)                                   |
| `src/use-cases/hr/companies/factories/make-companies.ts`                             | Create, Get (por ID), Get (por CNPJ), List, Update, Delete, Restore (7 factories) |
| `src/use-cases/hr/company-addresses/factories/make-company-addresses.ts`             | Múltiplas factories                                                               |
| `src/use-cases/hr/company-cnaes/factories/make-company-cnaes.ts`                     | Múltiplas factories                                                               |
| `src/use-cases/hr/company-fiscal-settings/factories/make-company-fiscal-settings.ts` | Múltiplas factories                                                               |

**Contraste com o padrão correto** (seguido pelo sub-módulo employees):

- `make-create-employee-use-case.ts` — uma factory por arquivo
- `make-get-employee-by-id-use-case.ts` — uma factory por arquivo

**Por que importa:** Ao agrupar múltiplas factories em um arquivo, aumenta-se o acoplamento e dificulta a localização rápida de onde determinado use case é instanciado. O padrão um-arquivo-por-factory facilita o `grep` e o rastreamento de dependências.

---

## Critério 8 — Padrão Mapper (conversões via mappers dedicados)

**Status: WARN**

O padrão mapper está bem estabelecido, com arquivos `*-to-dto.ts` e `*-prisma-to-domain.ts` para as entidades principais. Foram identificadas as seguintes inconsistências:

### 8.1 — Interface DTO duplicada em `index.ts` e no arquivo fonte

Os arquivos `src/mappers/hr/bonus/index.ts` e `src/mappers/hr/deduction/index.ts` re-exportam a interface `BonusDTO` e `DeductionDTO` diretamente no barrel, mas essas interfaces **já existem** nos respectivos arquivos fonte (`bonus-to-dto.ts` e `deduction-to-dto.ts`). Isso cria duas definições da mesma interface publicamente disponíveis, o que pode gerar conflitos de importação.

### 8.2 — Arquivo de schema obsoleto no nível de controller

O arquivo `src/http/controllers/hr/companies/company-api-schemas.ts` importa de `@/http/schemas/hr.schema` que está marcado como `@deprecated`:

```typescript
// company-api-schemas.ts linha 8
} from '@/http/schemas/hr.schema';
```

O arquivo `hr.schema.ts` contém no cabeçalho: `@deprecated Use imports from @/http/schemas/hr/* instead`. O mesmo padrão de importação deprecado ocorre em 18 outros controllers do módulo HR (suppliers, manufacturers, positions, company-stakeholder — conforme listado no Critério 2).

### 8.3 — Mapper de relações em `employee-to-dto.ts` mistura preocupações

A função `employeeToDTOWithRelations()` em `src/mappers/hr/employee/employee-to-dto.ts` aceita `prismaData` como segundo argumento, criando um acoplamento implícito com a estrutura do Prisma dentro do mapper de domínio. Isso introduz uma dependência de camada onde o mapper de domínio precisa conhecer formatos de dados do Prisma.

---

## Critério 9 — Tratamento de Erros com Classes de Domínio Específicas

**Status: FAIL**

Este é o critério mais crítico da auditoria. O módulo HR faz uso **sistemático e pervasivo** de `throw new Error()` genérico em vez das classes de erro de domínio disponíveis no projeto (`ResourceNotFoundError`, `BadRequestError`, etc.).

### Escala do problema

Foram identificados **mais de 80 lançamentos** de `new Error()` genérico nos use cases do módulo HR, distribuídos por todos os sub-módulos.

### Classes de erro disponíveis e não utilizadas

| Classe                  | Arquivo                                  | Quando usar                                            |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `ResourceNotFoundError` | `@/@errors/use-cases/resource-not-found` | Entidade não encontrada                                |
| `BadRequestError`       | `@/@errors/use-cases/bad-request-error`  | Dados de entrada inválidos, regras de negócio violadas |

### Exemplos representativos por sub-módulo

**employees/create-employee.ts:**

```typescript
// INCORRETO — linha 150
throw new Error('Employee with this CPF already exists');
// CORRETO
throw new BadRequestError('Employee with this CPF already exists');

// INCORRETO — linha 171
throw new Error('User is already linked to another employee');
// CORRETO
throw new BadRequestError('User is already linked to another employee');
```

**companies/create-company.ts:**

```typescript
// INCORRETO — linha 60
throw new Error('Company with this CNPJ already exists');
// CORRETO
throw new BadRequestError('Company with this CNPJ already exists');

// INCORRETO — linha 52
throw new Error('CNPJ is required');
// CORRETO
throw new BadRequestError('CNPJ is required');
```

**departments/update-department.ts:**

```typescript
// INCORRETO — linha 45
throw new Error('Department not found');
// CORRETO
throw new ResourceNotFoundError('Department');

// INCORRETO — linha 56
throw new Error('Department with this code already exists');
// CORRETO
throw new BadRequestError('Department with this code already exists');
```

**employees/update-employee.ts:**

```typescript
// INCORRETO — linha 409
throw new Error('Failed to update employee');
// CORRETO — pode ser InternalServerError ou verificação anterior ao save()
```

### Impacto nos controllers

Devido ao uso de `new Error()` genérico, os controllers precisam de lógica adicional de detecção textual para mapear erros para códigos HTTP corretos:

```typescript
// v1-approve-absence.controller.ts — linhas 68-74 (código defensivo necessário apenas por causa do FAIL-9)
if (
  error instanceof Error &&
  error.message.toLowerCase().includes('not found')
) {
  return reply.status(404).send({ message: error.message });
}
```

```typescript
// v1-get-bonus.controller.ts — linhas 49-53
if (
  error instanceof Error &&
  error.message.toLowerCase().includes('não encontrad')
) {
  return reply.status(404).send({ message: error.message });
}
```

Essa detecção textual é frágil: uma mudança na mensagem de erro quebra o mapeamento HTTP sem nenhum sinal de compilação.

### Por que importa

O uso de classes de erro de domínio específicas é fundamental porque:

1. **Type safety:** `instanceof ResourceNotFoundError` é verificado em tempo de compilação; busca textual não é.
2. **Versionamento de API:** Erros tipados permitem adicionar campos como `code` e `requestId` (implementados no sistema via `error-codes.ts`) de forma consistente.
3. **Rastreabilidade:** Erros tipados são capturados e classificados corretamente pelo Sentry e pelo sistema de monitoramento.
4. **Manutenibilidade:** Mudanças em mensagens de erro não quebram o mapeamento HTTP.

---

## Critério 10 — Ausência de Código Morto

**Status: WARN**

### 10.1 — Arquivo de serviço sem uso identificado (frontend)

| Arquivo                                                                       | Problema                                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `D:\Code\Projetos\OpenSea\OpenSea-APP\src\services\hr\enterprises.service.ts` | Arquivo `enterprises.service.ts` existe mas **não está exportado** no barrel `services/hr/index.ts` e **nenhuma importação** do arquivo foi encontrada no projeto. O serviço de empresas utilizado pelo frontend é `companies.service.ts`. |

### 10.2 — Hook com implementação mockada (frontend)

| Arquivo                                                     | Problema                                                                                                                                                                                 |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D:\Code\Projetos\OpenSea\OpenSea-APP\src\hooks\useUser.ts` | Contém implementação com `TODO` explícitos e dados mockados hardcoded (`mockUser`). O hook não é utilizado por nenhum componente da aplicação (zero ocorrências de `useUser` em `.tsx`). |

### 10.3 — `factories/index.ts` do employees omite 4 exports

Como mencionado no Critério 6.2, o barrel `src/use-cases/hr/employees/factories/index.ts` não exporta:

- `make-check-employee-cpf-use-case`
- `make-delete-employee-use-case`
- `make-get-my-employee-use-case`
- `make-create-employee-with-user-use-case`

Esses exports omitidos forçam os controllers a importar diretamente dos arquivos individuais, contornando o ponto de entrada do módulo.

---

## Resumo de Violações por Prioridade de Remediação

### Prioridade 1 — CRÍTICA (resolver imediatamente)

| ID  | Descrição                                                                                  | Arquivos afetados                                                                                                             |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 9.A | Substituir `throw new Error()` por `throw new ResourceNotFoundError()` nos use cases de HR | ~30 ocorrências em: employees, departments, positions, companies, work-schedules, absences, overtime, time-bank, time-control |
| 9.B | Substituir `throw new Error()` por `throw new BadRequestError()` nos use cases de HR       | ~50 ocorrências nos mesmos arquivos acima                                                                                     |

### Prioridade 2 — ALTA (resolver no próximo sprint)

| ID  | Descrição                                                                                                                                         | Arquivos afetados                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 5.A | Criar implementações in-memory para: companies, company-addresses, company-cnaes, company-fiscal-settings, company-stakeholder, base-organization | 5 novos arquivos em `src/repositories/hr/in-memory/` |
| 6.A | Extrair `mapContractType()`, `mapWorkRegime()` e `computePendingIssues()` para um módulo compartilhado                                            | `create-employee.ts`, `update-employee.ts`           |
| 6.B | Completar `src/use-cases/hr/employees/factories/index.ts` com os 4 exports ausentes                                                               | 1 arquivo                                            |

### Prioridade 3 — MÉDIA (resolver no próximo ciclo)

| ID  | Descrição                                                                            | Arquivos afetados                                                                              |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| 2.A | Adicionar prefixo `v1` às funções de todos os controllers sem o prefixo              | ~85 arquivos de controller                                                                     |
| 2.B | Adicionar sufixo `Controller` às funções de `company-stakeholder`                    | 4 arquivos                                                                                     |
| 7.A | Decompor factories agrupadas em arquivos individuais (`make-{usecase}-use-case.ts`)  | suppliers, manufacturers, companies, company-addresses, company-cnaes, company-fiscal-settings |
| 8.A | Migrar imports de `@/http/schemas/hr.schema` (deprecado) para `@/http/schemas/hr/*`  | 19 controllers                                                                                 |
| 8.B | Remover definição duplicada de `BonusDTO` e `DeductionDTO` do `index.ts` dos mappers | 2 arquivos                                                                                     |

### Prioridade 4 — BAIXA (limpeza técnica)

| ID   | Descrição                                                                            | Arquivos afetados |
| ---- | ------------------------------------------------------------------------------------ | ----------------- |
| 10.A | Deletar `src/services/hr/enterprises.service.ts` (arquivo morto, sem uso)            | 1 arquivo         |
| 10.B | Deletar `src/hooks/useUser.ts` (hook mockado, sem uso) ou implementá-lo corretamente | 1 arquivo         |
| 1.A  | Renomear `src/hooks/useUser.ts` para `src/hooks/use-user.ts`                         | 1 arquivo         |
| 6.C  | Mover `compute-pending-issues.ts` para pasta de utilitários ou helpers de domínio    | 1 arquivo         |

---

## Pontos Positivos Identificados

Para um diagnóstico equilibrado, seguem os pontos onde o módulo HR demonstra conformidade exemplar:

1. **Clean Architecture rigorosamente respeitada:** Nenhuma violação de importação entre camadas foi encontrada em todo o módulo.
2. **Padrão Value Object bem aplicado:** `CPF`, `PIS`, `EmployeeStatus`, `ContractType`, `WorkRegime`, `AbsenceStatus` etc. são Value Objects implementados como classes com validação encapsulada.
3. **Mappers completos para entidades principais:** `employee`, `absence`, `work-schedule`, `overtime`, `time-bank`, `vacation-period`, `payroll`, `payroll-item`, `bonus`, `deduction` possuem os três arquivos (`-to-dto.ts`, `-prisma-to-domain.ts`, `index.ts`).
4. **Path aliases 100% consistentes:** Nenhum import relativo profundo encontrado em todo o módulo.
5. **Tipos do frontend bem estruturados:** `src/types/hr/` segue o padrão modular com barrel exports e separação por entidade.
6. **Integração com TransactionManager:** O factory `make-approve-absence-use-case.ts` utiliza corretamente `PrismaTransactionManager`, demonstrando aplicação do padrão de transações.
7. **Integração com CalendarSyncService:** Os use cases de employee utilizam injeção de dependência opcional para sincronização com o calendário, com tratamento correto de falhas não-bloqueantes.
8. **Frontend HR modular:** A estrutura `(entities)/{entity}/src/{api,config,modals,types,utils}` demonstra organização consistente em todos os sub-módulos de frontend.

---

_Relatório gerado em 2026-03-10. Para esclarecimentos sobre qualquer critério, consulte `D:\Code\Projetos\OpenSea\OpenSea-API\docs\patterns\`._
