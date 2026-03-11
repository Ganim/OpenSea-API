# Module: HR (Human Resources)

## Overview

O módulo HR é responsável pela gestão completa do capital humano da organização. Abrange desde o cadastro de funcionários e estrutura organizacional (departamentos, cargos) até controles trabalhistas (ponto eletrônico, banco de horas, férias, ausências, horas extras) e folha de pagamento.

O módulo também unifica o cadastro de empresas empregadoras por meio de um **modelo polimórfico de Organization** que compartilha a mesma tabela Prisma com um discriminador `type`. Fornecedores e fabricantes foram removidos do módulo HR: fabricantes pertencem ao módulo `stock/` e fornecedores pertencem ao módulo `finance/`.

**Dependências com outros módulos:**
- `core` — autenticação JWT, multi-tenant, usuários (vínculo `Employee.userId`)
- `finance` — integração com folha via `CalendarSyncService` e exportação de folha (Phase 9)
- `calendar` — ao aprovar uma ausência, o hook cria um evento de calendário automaticamente
- `rbac` — permissões com escopo `.all` (toda a empresa) vs `.team` (subordinados diretos)

---

## Entities

### Employee

Entidade principal do módulo. Representa um colaborador vinculado a um tenant.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `UniqueEntityID` | sim | UUID gerado automaticamente |
| `tenantId` | `UniqueEntityID` | sim | Isolamento multi-tenant |
| `registrationNumber` | `string` | sim | Matrícula funcional única no tenant |
| `userId` | `UniqueEntityID?` | não | Vínculo com conta de usuário do sistema |
| `fullName` | `string` | sim | Nome completo |
| `socialName` | `string?` | não | Nome social (identidade de gênero) |
| `birthDate` | `Date?` | não | Data de nascimento |
| `gender` | `string?` | não | Gênero |
| `pcd` | `boolean` | sim | Pessoa com deficiência |
| `maritalStatus` | `string?` | não | Estado civil |
| `cpf` | `CPF` | sim | CPF validado (Value Object) |
| `rg` | `string?` | não | RG |
| `rgIssuer` | `string?` | não | Órgão emissor do RG |
| `rgIssueDate` | `Date?` | não | Data de emissão do RG |
| `pis` | `PIS?` | não | PIS/PASEP validado (Value Object) |
| `ctpsNumber` | `string?` | não | Número da CTPS |
| `ctpsSeries` | `string?` | não | Série da CTPS |
| `ctpsState` | `string?` | não | Estado de emissão da CTPS |
| `voterTitle` | `string?` | não | Título de eleitor |
| `email` | `string?` | não | E-mail corporativo |
| `personalEmail` | `string?` | não | E-mail pessoal |
| `phone` | `string?` | não | Telefone fixo |
| `mobilePhone` | `string?` | não | Celular |
| `emergencyContact` | `string?` | não | Nome do contato de emergência |
| `emergencyPhone` | `string?` | não | Telefone de emergência |
| `address` | `string?` | não | Logradouro |
| `city` | `string?` | não | Cidade |
| `state` | `string?` | não | Estado (UF) |
| `zipCode` | `string?` | não | CEP |
| `country` | `string` | sim | País (padrão `BR`) |
| `bankCode` | `string?` | não | Código do banco |
| `bankAgency` | `string?` | não | Agência bancária |
| `bankAccount` | `string?` | não | Conta bancária |
| `pixKey` | `string?` | não | Chave Pix |
| `departmentId` | `UniqueEntityID?` | não | Departamento |
| `positionId` | `UniqueEntityID?` | não | Cargo |
| `supervisorId` | `UniqueEntityID?` | não | Supervisor direto (auto-referência) |
| `companyId` | `UniqueEntityID?` | não | Empresa empregadora |
| `hireDate` | `Date` | sim | Data de admissão |
| `terminationDate` | `Date?` | não | Data de desligamento |
| `status` | `EmployeeStatus` | sim | Status (Value Object) |
| `baseSalary` | `number` | sim | Salário base em centavos |
| `contractType` | `ContractType` | sim | Tipo de contrato (Value Object) |
| `workRegime` | `WorkRegime` | sim | Regime de trabalho (Value Object) |
| `weeklyHours` | `number` | sim | Horas semanais |
| `emergencyContactInfo` | `EmergencyContactInfo?` | não | JSON com nome, telefone e parentesco |
| `healthConditions` | `HealthCondition[]?` | não | JSON com descrição e flag de atenção |
| `photoUrl` | `string?` | não | URL da foto |
| `metadata` | `Record<string, unknown>` | sim | Dados extras (padrão `{}`) |
| `pendingIssues` | `string[]` | sim | Campos cadastrais pendentes |
| `deletedAt` | `Date?` | não | Soft delete |
| `createdAt` / `updatedAt` | `Date` | sim | Timestamps de auditoria |

**Métodos de domínio relevantes:**
- `terminate(terminationDate)` — muda status para `TERMINATED` e registra data; lança erro se já desligado
- `changeStatus(newStatus)` — proíbe reativar funcionário desligado
- `updateSalary(newSalary)` — valida que o novo salário é positivo
- `isActive()`, `canWork()`, `requiresTimeTracking()`, `hasEmploymentRights()` — guards de negócio

---

### Department

Estrutura hierárquica de departamentos. Suporta árvore com `parentId`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenantId` | `UniqueEntityID` | sim | Isolamento multi-tenant |
| `name` | `string` | sim | Nome do departamento |
| `code` | `string` | sim | Código único no tenant |
| `description` | `string?` | não | Descrição |
| `parentId` | `UniqueEntityID?` | não | Departamento pai (hierarquia) |
| `managerId` | `UniqueEntityID?` | não | Gestor responsável (Employee) |
| `companyId` | `UniqueEntityID` | sim | Empresa a que pertence |
| `isActive` | `boolean` | sim | Ativo (padrão `true`) |
| `deletedAt` | `Date?` | não | Soft delete |

**Regras:** Um departamento não pode ser seu próprio `parentId`. Ao fazer soft delete, `isActive` é setado para `false` simultaneamente.

---

### Position

Cargos e faixas salariais.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tenantId` | `UniqueEntityID` | sim | Isolamento multi-tenant |
| `name` | `string` | sim | Nome do cargo |
| `code` | `string` | sim | Código único |
| `description` | `string?` | não | Descrição |
| `departmentId` | `UniqueEntityID?` | não | Departamento sugerido |
| `level` | `number` | sim | Nível hierárquico (mínimo 1) |
| `minSalary` | `number?` | não | Salário mínimo da faixa |
| `maxSalary` | `number?` | não | Salário máximo da faixa |
| `baseSalary` | `number?` | não | Salário base sugerido |
| `isActive` | `boolean` | sim | Ativo (padrão `true`) |

**Regra:** `minSalary` não pode ser maior que `maxSalary`. O método `isSalaryInRange(salary)` valida se um salário proposto está dentro da faixa.

---

### Company (migrada para Admin)

Localizada em `src/entities/core/company.ts` (migrada de `hr/`). Entidade dedicada para empresas empregadoras com campos específicos do contexto brasileiro. O CRUD completo agora pertence ao módulo **Admin** (`/v1/admin/companies`). O módulo HR mantém acesso **somente leitura** via `hr.companies.read`. Coexiste com o modelo polimórfico (ver seção Organization abaixo).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `legalName` | `string` | sim | Razão social |
| `cnpj` | `string` | sim | CNPJ (obrigatório para empresa) |
| `tradeName` | `string?` | não | Nome fantasia |
| `stateRegistration` | `string?` | não | Inscrição Estadual (IE) |
| `municipalRegistration` | `string?` | não | Inscrição Municipal (IM) |
| `legalNature` | `string?` | não | Natureza jurídica |
| `taxRegime` | `TaxRegime?` | não | Regime tributário |
| `activityStartDate` | `Date?` | não | Data de início das atividades |
| `status` | `CompanyStatus` | sim | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| `email` | `string?` | não | E-mail principal |
| `phoneMain` | `string?` | não | Telefone principal |
| `phoneAlt` | `string?` | não | Telefone alternativo |
| `logoUrl` | `string?` | não | URL do logotipo |
| `pendingIssues` | `string[]` | sim | Campos cadastrais pendentes |

**`TaxRegime`:** `SIMPLES`, `LUCRO_PRESUMIDO`, `LUCRO_REAL`, `IMUNE_ISENTA`, `OUTROS`

O método `calculatePendingIssues()` retorna uma lista de strings com os campos ainda não preenchidos (ex: `'trade_name_not_defined'`, `'tax_regime_not_defined'`). É recalculado automaticamente a cada `updateMainData()`.

---

### WorkSchedule

Jornada de trabalho semanal.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | sim | Nome da jornada |
| `mondayStart` — `sundayStart` | `string?` | não | Hora de início no formato `HH:mm` |
| `mondayEnd` — `sundayEnd` | `string?` | não | Hora de fim no formato `HH:mm` |
| `breakDuration` | `number` | sim | Duração do intervalo em minutos |
| `isActive` | `boolean` | sim | Jornada ativa |

**Métodos:** `isWorkingDay(day)`, `calculateDailyHours(day)`, `calculateWeeklyHours()`.

---

### Absence

Registro de ausências do funcionário.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `employeeId` | `UniqueEntityID` | sim | Funcionário |
| `type` | `AbsenceType` | sim | Tipo de ausência (Value Object) |
| `status` | `AbsenceStatus` | sim | Status do fluxo de aprovação |
| `startDate` / `endDate` | `Date` | sim | Período |
| `totalDays` | `number` | sim | Total de dias (calculado) |
| `isPaid` | `boolean` | sim | Se a ausência é remunerada |
| `isInssResponsibility` | `boolean?` | não | Se o INSS assume (atestado > 15 dias) |
| `cid` | `string?` | não | Código CID do atestado médico |
| `documentUrl` | `string?` | não | URL do documento comprobatório |
| `reason` | `string?` | não | Justificativa |
| `approvedBy` | `UniqueEntityID?` | não | Quem aprovou/rejeitou |
| `rejectionReason` | `string?` | não | Motivo da rejeição |
| `vacationPeriodId` | `UniqueEntityID?` | não | Vinculação ao período de férias |

**Método estático:** `Absence.calculateTotalDays(start, end)` — calcula dias incluindo início e fim.

---

### Payroll

Folha de pagamento mensal do tenant.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `referenceMonth` | `number` | sim | Mês de referência (1–12) |
| `referenceYear` | `number` | sim | Ano de referência (2000–2100) |
| `status` | `PayrollStatus` | sim | Status do fluxo da folha |
| `totalGross` | `number` | sim | Total bruto |
| `totalDeductions` | `number` | sim | Total de deduções |
| `totalNet` | `number` | sim | Líquido (calculado: `gross - deductions`) |
| `items` | `PayrollItem[]?` | não | Itens por funcionário |
| `processedBy` / `approvedBy` / `paidBy` | `UniqueEntityID?` | não | Rastreio por ação |
| `processedAt` / `approvedAt` / `paidAt` | `Date?` | não | Timestamps de cada ação |

**Computed:** `referencePeriod` retorna `YYYY-MM`; `employeeCount` conta funcionários únicos nos itens.

---

### Entidades Auxiliares de RH

| Entidade | Arquivo | Propósito |
|----------|---------|-----------|
| `TimeEntry` | `time-entry.ts` | Registro de ponto (clock-in / clock-out) |
| `TimeBank` | `time-bank.ts` | Saldo de banco de horas por funcionário |
| `Overtime` | `overtime.ts` | Solicitação de hora extra |
| `VacationPeriod` | `vacation-period.ts` | Período aquisitivo/concessivo de férias |
| `Bonus` | `bonus.ts` | Bônus avulso vinculado a funcionário |
| `Deduction` | `deduction.ts` | Desconto avulso vinculado a funcionário |
| `PayrollItem` | `payroll-item.ts` | Item individual da folha por funcionário |
| `CompanyAddress` | `company-address.ts` | Endereços múltiplos da empresa |
| `CompanyCnae` | `company-cnae.ts` | CNAEs principal e secundários |
| `CompanyFiscalSettings` | `company-fiscal-settings.ts` | Configurações fiscais (DAS, eSocial etc.) |
| `CompanyStakeholder` | `company-stakeholder.ts` | Sócios e representantes legais |

---

## Value Objects

### CPF

```typescript
// src/entities/hr/value-objects/cpf.ts
const cpf = CPF.create('123.456.789-09');
cpf.value;     // '12345678909' (apenas dígitos)
cpf.formatted; // '123.456.789-09'
```

Validação completa com dois dígitos verificadores. Lança `Error('CPF inválido')` se inválido. Rejeita sequências homogêneas (ex: `111.111.111-11`).

---

### PIS

```typescript
const pis = PIS.create('123.45678.90-1');
pis.formatted; // '123.45678.90-1'
```

Validação com pesos `[3,2,9,8,7,6,5,4,3,2]` conforme especificação CAIXA/MTE.

---

### EmployeeStatus

| Valor | Descrição | `canWork()` |
|-------|-----------|-------------|
| `ACTIVE` | Ativo em exercício | `true` |
| `ON_LEAVE` | Afastado temporariamente | `true` |
| `VACATION` | Em férias | `false` |
| `SUSPENDED` | Suspenso | `false` |
| `TERMINATED` | Desligado | `false` |

---

### ContractType

| Valor | `hasEmploymentRights()` | Descrição |
|-------|------------------------|-----------|
| `CLT` | `true` | Consolidação das Leis do Trabalho |
| `PJ` | `false` | Pessoa Jurídica (prestador) |
| `INTERN` | `true` | Estagiário |
| `TEMPORARY` | `false` | Contrato temporário |
| `APPRENTICE` | `true` | Aprendiz (Lei 10.097/2000) |

---

### WorkRegime

| Valor | `requiresTimeTracking()` | `hasFixedSchedule()` |
|-------|--------------------------|----------------------|
| `FULL_TIME` | `false` | `true` |
| `PART_TIME` | `false` | `true` |
| `HOURLY` | `true` | `false` |
| `SHIFT` | `true` | `true` |
| `FLEXIBLE` | `true` | `false` |

---

### AbsenceType

Onze tipos de ausência conforme a legislação trabalhista brasileira.

| Valor | Requer documento | Requer aprovação | Máximo de dias (CLT) |
|-------|-----------------|-----------------|----------------------|
| `VACATION` | não | sim | 30 |
| `SICK_LEAVE` | sim | não | — |
| `MATERNITY_LEAVE` | sim | não | 120 |
| `PATERNITY_LEAVE` | sim | não | 5 |
| `BEREAVEMENT_LEAVE` | sim | não | 2 |
| `WEDDING_LEAVE` | sim | não | 3 |
| `MEDICAL_APPOINTMENT` | sim | não | — |
| `JURY_DUTY` | sim | não | — |
| `PERSONAL_LEAVE` | não | sim | — |
| `UNPAID_LEAVE` | não | sim | — |
| `OTHER` | não | não | — |

**Regra `isPaid()`:** toda ausência exceto `UNPAID_LEAVE` é considerada remunerada.
**Regra INSS:** campo `isInssResponsibility` aplicável a `SICK_LEAVE` com duração > 15 dias (art. 59 da Lei 8.213/91).

---

### AbsenceStatus

Máquina de estados de aprovação:

```
PENDING → APPROVED → IN_PROGRESS → COMPLETED
        → REJECTED
PENDING → CANCELLED
APPROVED → CANCELLED
```

---

### PayrollStatus

Máquina de estados da folha de pagamento:

```
DRAFT → PROCESSING → CALCULATED → APPROVED → PAID
DRAFT → CANCELLED
CALCULATED → CANCELLED
```

`canBeEdited()` retorna `true` apenas nos estados `DRAFT` e `PROCESSING`.

---

### VacationStatus

| Valor | Descrição |
|-------|-----------|
| `PENDING` | Aguardando agendamento |
| `SCHEDULED` | Férias agendadas |
| `IN_PROGRESS` | Férias em andamento |
| `COMPLETED` | Férias concluídas |
| `CANCELLED` | Canceladas |

---

## Organization Polymorphism

O modelo polimórfico unifica entidades organizacionais em uma única tabela Prisma `organizations`, discriminada pelo campo `type`. No módulo HR, apenas os tipos `COMPANY` e `CUSTOMER` são suportados. Fabricantes foram movidos para `stock/` e fornecedores para `finance/`.

```
Organization (abstract)
  ├── Company   (type: 'COMPANY')
  └── Customer  (type: 'CUSTOMER')
```

**Localização:** `src/entities/hr/organization/`

### Campos comuns (Organization base)

| Campo | Type | Descrição |
|-------|------|-----------|
| `type` | `OrganizationType` | Discriminador: `COMPANY`, `CUSTOMER` |
| `legalName` | `string` | Razão social |
| `cnpj` | `string?` | CNPJ (obrigatório para Company) |
| `cpf` | `string?` | CPF (alternativa ao CNPJ) |
| `tradeName` | `string?` | Nome fantasia |
| `stateRegistration` | `string?` | Inscrição Estadual |
| `taxRegime` | `TaxRegime?` | Regime tributário |
| `status` | `OrganizationStatus` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `BLOCKED` |
| `email` / `phoneMain` / `website` | `string?` | Contatos |
| `typeSpecificData` | `JSON?` | Dados exclusivos do subtipo |
| `metadata` | `JSON?` | Dados extras livres |

**Validação base:** `validateFiscalId()` — lança erro se nem `cnpj` nem `cpf` estiverem presentes.

### Company-specific (`typeSpecificData`)

Campos adicionais armazenados em JSON dentro de `typeSpecificData`:
`legalNature`, `taxRegimeDetail`, `activityStartDate`, `phoneAlt`, `logoUrl`, `pendingIssues[]`.

**Regra:** `CNPJ` é obrigatório para `Company.create()`.

---

## Endpoints

### Employees

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/employees` | `hr.employees.create` | Cadastra funcionário |
| `POST` | `/v1/hr/employees/with-user` | `hr.employees.create` | Cadastra funcionário já vinculado a um usuário |
| `GET` | `/v1/hr/employees` | `hr.employees.list.all` ou `hr.employees.list.team` | Lista paginada |
| `GET` | `/v1/hr/employees/:id` | `hr.employees.read.all` ou `hr.employees.read.team` | Detalhe |
| `PUT` | `/v1/hr/employees/:id` | `hr.employees.update.all` ou `hr.employees.update.team` | Atualiza dados |
| `DELETE` | `/v1/hr/employees/:id` | `hr.employees.delete` | Soft delete |
| `POST` | `/v1/hr/employees/:id/terminate` | `hr.employees.terminate` | Desliga funcionário |
| `PATCH` | `/v1/hr/employees/:employeeId/suspend` | `hr.employees.manage` | Suspende funcionário (`ACTIVE` → `SUSPENDED`) |
| `PATCH` | `/v1/hr/employees/:employeeId/reactivate` | `hr.employees.manage` | Reativa funcionário (`SUSPENDED`/`ON_LEAVE` → `ACTIVE`) |
| `PATCH` | `/v1/hr/employees/:employeeId/on-leave` | `hr.employees.manage` | Coloca funcionário em afastamento (`ACTIVE` → `ON_LEAVE`) |
| `POST` | `/v1/hr/employees/:id/transfer` | `hr.employees.manage` | Transfere de departamento/cargo |
| `POST` | `/v1/hr/employees/:id/link-user` | `hr.employees.manage` | Vincula conta de usuário |
| `GET` | `/v1/hr/employees/check-cpf` | `hr.employees.read` | Verifica duplicidade de CPF |
| `GET` | `/v1/hr/employees/label-data` | `hr.employees.read` | Dados de funcionários para geração de etiquetas |

### Departments

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/departments` | `hr.departments.create` | Cria departamento |
| `GET` | `/v1/hr/departments` | `hr.departments.list` | Lista paginada |
| `GET` | `/v1/hr/departments/:id` | `hr.departments.read` | Detalhe |
| `PUT` | `/v1/hr/departments/:id` | `hr.departments.update` | Atualiza |
| `DELETE` | `/v1/hr/departments/:id` | `hr.departments.delete` | Soft delete |

### Positions

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/positions` | `hr.positions.create` | Cria cargo |
| `GET` | `/v1/hr/positions` | `hr.positions.list` | Lista paginada |
| `GET` | `/v1/hr/positions/:id` | `hr.positions.read` | Detalhe |
| `PUT` | `/v1/hr/positions/:id` | `hr.positions.update` | Atualiza |
| `DELETE` | `/v1/hr/positions/:id` | `hr.positions.delete` | Soft delete |

### Companies

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/companies` | `hr.companies.create` | Cria empresa empregadora |
| `GET` | `/v1/hr/companies` | `hr.companies.list` | Lista paginada |
| `GET` | `/v1/hr/companies/:id` | `hr.companies.read` | Detalhe (com subrecursos) |
| `PUT` | `/v1/hr/companies/:id` | `hr.companies.update` | Atualiza dados principais |
| `DELETE` | `/v1/hr/companies/:id` | `hr.companies.delete` | Soft delete |
| `GET` | `/v1/hr/companies/check-cnpj` | `hr.companies.read` | Verifica duplicidade de CNPJ |

### Company Addresses

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/companies/:id/addresses` | `hr.company-addresses.create` | Adiciona endereço |
| `GET` | `/v1/hr/companies/:id/addresses` | `hr.company-addresses.list` | Lista endereços |
| `PUT` | `/v1/hr/companies/:id/addresses/:addressId` | `hr.company-addresses.update` | Atualiza endereço |
| `DELETE` | `/v1/hr/companies/:id/addresses/:addressId` | `hr.company-addresses.delete` | Remove endereço |

### Company CNAEs

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/companies/:id/cnaes` | `hr.company-cnaes.create` | Adiciona CNAE |
| `GET` | `/v1/hr/companies/:id/cnaes` | `hr.company-cnaes.list` | Lista CNAEs |
| `GET` | `/v1/hr/companies/:id/cnaes/primary` | `hr.company-cnaes.read` | CNAE principal |
| `GET` | `/v1/hr/companies/:id/cnaes/:cnaeId` | `hr.company-cnaes.read` | Detalhe de um CNAE |
| `PUT` | `/v1/hr/companies/:id/cnaes/:cnaeId` | `hr.company-cnaes.update` | Atualiza CNAE |
| `DELETE` | `/v1/hr/companies/:id/cnaes/:cnaeId` | `hr.company-cnaes.delete` | Remove CNAE |

### Company Fiscal Settings

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/companies/:id/fiscal-settings` | `hr.company-fiscal-settings.create` | Cria configurações fiscais |
| `GET` | `/v1/hr/companies/:id/fiscal-settings` | `hr.company-fiscal-settings.read` | Retorna configurações |
| `PUT` | `/v1/hr/companies/:id/fiscal-settings` | `hr.company-fiscal-settings.update` | Atualiza configurações |
| `DELETE` | `/v1/hr/companies/:id/fiscal-settings` | `hr.company-fiscal-settings.delete` | Remove configurações |

### Company Stakeholders

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/companies/:id/stakeholders` | `hr.stakeholders.create` | Adiciona sócio/representante |
| `GET` | `/v1/hr/companies/:id/stakeholders` | `hr.stakeholders.list` | Lista stakeholders |
| `PUT` | `/v1/hr/companies/:id/stakeholders/:stakeholderId` | `hr.stakeholders.update` | Atualiza |
| `DELETE` | `/v1/hr/companies/:id/stakeholders/:stakeholderId` | `hr.stakeholders.delete` | Remove |

### Reports (Exportação CSV)

Todos os endpoints de relatório retornam um arquivo CSV com BOM UTF-8, separador ponto e vírgula e cabeçalhos em português.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/hr/reports/employees` | `reports.hr.headcount` | Exporta quadro de funcionários |
| `GET` | `/v1/hr/reports/absences` | `reports.hr.absences` | Exporta relatório de ausências |
| `GET` | `/v1/hr/reports/payroll` | `reports.hr.generate` | Exporta resumo de folha de pagamento |

**Filtros disponíveis:**

- `GET /v1/hr/reports/employees` — `status`, `departmentId`, `positionId`, `companyId`
- `GET /v1/hr/reports/absences` — `startDate`, `endDate`, `employeeId`, `type`, `status`
- `GET /v1/hr/reports/payroll` — `referenceMonth`, `referenceYear`

### Work Schedules

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/work-schedules` | `hr.work-schedules.create` | Cria jornada |
| `GET` | `/v1/hr/work-schedules` | `hr.work-schedules.list` | Lista paginada |
| `GET` | `/v1/hr/work-schedules/:id` | `hr.work-schedules.read` | Detalhe |
| `PUT` | `/v1/hr/work-schedules/:id` | `hr.work-schedules.update` | Atualiza |
| `DELETE` | `/v1/hr/work-schedules/:id` | `hr.work-schedules.delete` | Remove |

### Time Control (Ponto Eletrônico)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/time-control/clock-in` | `hr.time-control.create` | Registra entrada |
| `POST` | `/v1/hr/time-control/clock-out` | `hr.time-control.create` | Registra saída |
| `GET` | `/v1/hr/time-control` | `hr.time-control.list` | Lista registros de ponto |
| `GET` | `/v1/hr/time-control/worked-hours` | `hr.time-control.read` | Horas trabalhadas calculadas |

### Absences (Ausências)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/absences/vacation` | `hr.absences.create` | Solicita férias |
| `POST` | `/v1/hr/absences/sick-leave` | `hr.absences.create` | Registra atestado médico |
| `GET` | `/v1/hr/absences` | `hr.absences.list.all` ou `hr.absences.list.team` | Lista ausências |
| `GET` | `/v1/hr/absences/:id` | `hr.absences.read.all` ou `hr.absences.read.team` | Detalhe |
| `POST` | `/v1/hr/absences/:id/approve` | `hr.absences.approve.all` ou `hr.absences.approve.team` | Aprova ausência |
| `POST` | `/v1/hr/absences/:id/reject` | `hr.absences.approve.all` ou `hr.absences.approve.team` | Rejeita ausência |
| `POST` | `/v1/hr/absences/:id/cancel` | `hr.absences.update` | Cancela ausência |
| `GET` | `/v1/hr/absences/vacation-balance` | `hr.absences.read` | Saldo de férias do funcionário |

### Vacation Periods (Períodos de Férias)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/vacation-periods` | `hr.vacation-periods.create` | Cria período aquisitivo |
| `GET` | `/v1/hr/vacation-periods` | `hr.vacation-periods.list` | Lista períodos |
| `GET` | `/v1/hr/vacation-periods/:id` | `hr.vacation-periods.read` | Detalhe |
| `POST` | `/v1/hr/vacation-periods/:id/schedule` | `hr.vacation-periods.update` | Agenda início das férias |
| `POST` | `/v1/hr/vacation-periods/:id/start` | `hr.vacation-periods.update` | Inicia férias |
| `POST` | `/v1/hr/vacation-periods/:id/complete` | `hr.vacation-periods.update` | Conclui férias |
| `POST` | `/v1/hr/vacation-periods/:id/cancel` | `hr.vacation-periods.update` | Cancela agendamento |
| `POST` | `/v1/hr/vacation-periods/:id/sell-days` | `hr.vacation-periods.update` | Abono pecuniário (venda de dias) |
| `PATCH` | `/v1/hr/vacation-periods/:id/complete-acquisition` | `hr.vacation-periods.manage` | Conclui período aquisitivo (`PENDING` → `AVAILABLE`) |

### Overtime (Horas Extras)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/overtime` | `hr.overtime.create` | Solicita hora extra |
| `GET` | `/v1/hr/overtime` | `hr.overtime.list.all` ou `hr.overtime.list.team` | Lista solicitações |
| `GET` | `/v1/hr/overtime/:id` | `hr.overtime.read.all` ou `hr.overtime.read.team` | Detalhe |
| `POST` | `/v1/hr/overtime/:id/approve` | `hr.overtime.approve.all` ou `hr.overtime.approve.team` | Aprova |

### Time Bank (Banco de Horas)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `GET` | `/v1/hr/time-bank` | `hr.time-bank.list.all` ou `hr.time-bank.list.team` | Lista bancos de horas |
| `GET` | `/v1/hr/time-bank/:id` | `hr.time-bank.read.all` ou `hr.time-bank.read.team` | Saldo de um funcionário |
| `POST` | `/v1/hr/time-bank/:id/credit` | `hr.time-bank.manage` | Credita horas |
| `POST` | `/v1/hr/time-bank/:id/debit` | `hr.time-bank.manage` | Debita horas |
| `POST` | `/v1/hr/time-bank/:id/adjust` | `hr.time-bank.manage` | Ajuste manual de saldo |

### Payrolls (Folha de Pagamento)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/payrolls` | `hr.payrolls.create` | Cria folha (status `DRAFT`) |
| `GET` | `/v1/hr/payrolls` | `hr.payrolls.list` | Lista folhas |
| `GET` | `/v1/hr/payrolls/:id` | `hr.payrolls.read` | Detalhe com itens |
| `POST` | `/v1/hr/payrolls/:id/calculate` | `hr.payroll.process` | Processa cálculo |
| `POST` | `/v1/hr/payrolls/:id/approve` | `hr.payroll.approve` | Aprova folha |
| `POST` | `/v1/hr/payrolls/:id/pay` | `hr.payroll.approve` | Marca como paga |
| `POST` | `/v1/hr/payrolls/:id/cancel` | `hr.payrolls.manage` | Cancela folha |

### Bonuses e Deductions

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| `POST` | `/v1/hr/bonuses` | `hr.bonuses.create` | Cria bônus avulso |
| `GET` | `/v1/hr/bonuses` | `hr.bonuses.list` | Lista bônus |
| `GET` | `/v1/hr/bonuses/:id` | `hr.bonuses.read` | Detalhe |
| `DELETE` | `/v1/hr/bonuses/:id` | `hr.bonuses.delete` | Remove |
| `POST` | `/v1/hr/deductions` | `hr.deductions.create` | Cria desconto avulso |
| `GET` | `/v1/hr/deductions` | `hr.deductions.list` | Lista descontos |
| `GET` | `/v1/hr/deductions/:id` | `hr.deductions.read` | Detalhe |
| `DELETE` | `/v1/hr/deductions/:id` | `hr.deductions.delete` | Remove |

---

### Exemplos de Request/Response

#### Criar Funcionário — `POST /v1/hr/employees`

```json
{
  "registrationNumber": "EMP-0042",
  "fullName": "Ana Paula Ferreira",
  "cpf": "123.456.789-09",
  "hireDate": "2024-03-01",
  "baseSalary": 550000,
  "contractType": "CLT",
  "workRegime": "FULL_TIME",
  "weeklyHours": 44,
  "country": "BR",
  "departmentId": "uuid-do-departamento",
  "positionId": "uuid-do-cargo",
  "companyId": "uuid-da-empresa"
}
```

Resposta `201`:
```json
{
  "employee": {
    "id": "uuid-gerado",
    "registrationNumber": "EMP-0042",
    "fullName": "Ana Paula Ferreira",
    "cpf": "123.456.789-09",
    "status": "ACTIVE",
    "contractType": "CLT",
    "workRegime": "FULL_TIME",
    "baseSalary": 550000,
    "hireDate": "2024-03-01T00:00:00.000Z",
    "pendingIssues": [],
    "createdAt": "2024-03-01T10:00:00.000Z"
  }
}
```

#### Aprovar Ausência — `POST /v1/hr/absences/:id/approve`

```json
{}
```

Resposta `200`:
```json
{
  "absence": {
    "id": "uuid-ausencia",
    "employeeId": "uuid-funcionario",
    "type": "SICK_LEAVE",
    "status": "APPROVED",
    "startDate": "2024-03-15",
    "endDate": "2024-03-17",
    "totalDays": 3,
    "isPaid": true,
    "approvedBy": "uuid-gestor",
    "approvedAt": "2024-03-10T14:00:00.000Z"
  }
}
```

---

## Business Rules

### Regra 1: Soft Delete Universal

Todas as entidades principais (`Employee`, `Department`, `Position`, `Company`) utilizam soft delete via campo `deletedAt`. Registros deletados são excluídos das listagens por padrão, mas mantidos para rastreabilidade histórica (essencial em contexto trabalhista e fiscal).

### Regra 2: Status de Funcionário Desligado é Irreversível

Ao chamar `employee.terminate()`, o status muda para `TERMINATED`. O método `changeStatus()` da entidade lança erro se tentar mudar de `TERMINATED` para qualquer outro valor. A única operação permitida após o desligamento é a leitura histórica dos dados.

### Regra 3: Fluxo de Aprovação de Ausência

```
Funcionário solicita → PENDING
  Gestor aprova     → APPROVED → (início do período) → IN_PROGRESS → COMPLETED
  Gestor rejeita    → REJECTED
  Cancelamento      → CANCELLED (apenas de PENDING ou APPROVED)
```

Ao aprovar uma ausência, o `CalendarSyncService` cria automaticamente um evento de calendário vinculado (`systemSourceType: 'absence'`).

### Regra 4: Fluxo de Folha de Pagamento

```
Criação → DRAFT
  Cálculo automático → PROCESSING → CALCULATED
  Aprovação          → APPROVED
  Pagamento          → PAID
  Cancelamento       → CANCELLED (apenas de DRAFT ou CALCULATED)
```

Itens só podem ser adicionados/removidos enquanto `canBeEdited()` retornar `true` (`DRAFT` ou `PROCESSING`). Após `APPROVED`, a folha é imutável.

### Regra 5: Acesso com Escopo `.all` vs `.team`

Recursos relacionados a funcionários (listagem, leitura, atualização, aprovação de ausências, horas extras, banco de horas) possuem duas variantes de permissão:

- **`.all`** — acesso a todos os funcionários do tenant (RH, diretoria)
- **`.team`** — acesso restrito aos subordinados diretos (gestores de equipe)

O escopo é resolvido no controller/use case com base no `supervisorId` dos funcionários versus o `userId` do requisitante.

### Regra 6: Pendências Cadastrais (Company)

O método `calculatePendingIssues()` da entidade `Company` retorna códigos de string para cada campo obrigatório não preenchido. É recalculado automaticamente em cada `updateMainData()`. A lista `pendingIssues` é armazenada persistida para consultas eficientes (sem recalcular no banco).

Campos que geram pendência: `tradeName`, `stateRegistration`, `municipalRegistration`, `legalNature`, `taxRegime`, `activityStartDate`, `email`, `phoneMain`, `phoneAlt`, `logoUrl`.

### Regra 7: Validação de CNPJ na Organization (Company)

- `Company.create()` exige `cnpj` (lança erro se ausente)
- Outros subtipos (`CUSTOMER`) exigem `cnpj` **ou** `cpf` via `validateFiscalId()` (suporta MEI/pessoa física)

### Regra 8: Abono Pecuniário de Férias

O endpoint `POST /v1/hr/vacation-periods/:id/sell-days` implementa a venda de 1/3 das férias (abono pecuniário), conforme art. 143 da CLT. A operação muda o período de férias e registra os dias vendidos para cômputo na folha.

### Regra 9: Transições de Status do Funcionário

Além do desligamento definitivo (`terminate`), três transições de status reversíveis são disponibilizadas:

| Endpoint | Transição | Body |
|----------|-----------|------|
| `PATCH .../suspend` | `ACTIVE` → `SUSPENDED` | `{ reason: string }` |
| `PATCH .../on-leave` | `ACTIVE` → `ON_LEAVE` | `{ reason: string }` |
| `PATCH .../reactivate` | `SUSPENDED` ou `ON_LEAVE` → `ACTIVE` | — |

Todas exigem a permissão `hr.employees.manage`. Tentar reativar um funcionário com status `TERMINATED` continua sendo proibido pela entidade.

### Regra 10: Ciclo de Vida do Período Aquisitivo de Férias

O endpoint `PATCH /v1/hr/vacation-periods/:id/complete-acquisition` (use case `CompleteAcquisitionUseCase`) efetua a transição `PENDING` → `AVAILABLE`, sinalizando que o funcionário completou os 12 meses aquisitivos e pode usufruir das férias.

Um cron script autônomo (`scripts/expire-vacations-cron.ts`) é responsável por expirar em lote os períodos cujo `concessionEnd` seja anterior à data atual, executando o `ExpireVacationPeriodsUseCase`. O script deve ser agendado externamente (systemd timer, cron ou similar) e opera de forma idempotente.

### Regra 11: Audit Logging em Operações HR

Os controllers do módulo HR utilizam `queueAuditLog()` com mensagens centralizadas em `src/constants/audit-messages/hr.messages.ts` (`HR_AUDIT_MESSAGES`). As seguintes operações são auditadas: CRUD de funcionários, empresas, departamentos, cargos, ausências, horas extras, folha de pagamento, bônus, deduções, stakeholders, banco de horas, períodos de férias e jornadas de trabalho.

### Regra 12: Tabelas Fiscais Versionadas (INSS/IRRF)

As alíquotas de INSS e IRRF estão externalizadas em `src/constants/hr/tax-tables.ts` com estrutura versionada por ano (`INSS_TABLES: Record<number, INSSTable>` e `IRRF_TABLES: Record<number, IRRFTable>`). A função auxiliar `getTaxTable(year)` retorna a tabela do ano solicitado ou, na ausência de entrada para aquele ano, a tabela mais recente disponível. Para adicionar um novo ano fiscal, basta inserir uma nova chave no dicionário correspondente.

---

## Permissions

### Permissões com Escopo

| Código | Descrição |
|--------|-----------|
| `hr.employees.read.all` | Lê qualquer funcionário do tenant |
| `hr.employees.read.team` | Lê apenas subordinados diretos |
| `hr.employees.list.all` | Lista todos os funcionários |
| `hr.employees.list.team` | Lista subordinados diretos |
| `hr.employees.update.all` | Atualiza qualquer funcionário |
| `hr.employees.update.team` | Atualiza subordinados diretos |
| `hr.absences.list.all` / `hr.absences.list.team` | Lista ausências por escopo |
| `hr.absences.approve.all` / `hr.absences.approve.team` | Aprova ausências por escopo |
| `hr.overtime.list.all` / `hr.overtime.list.team` | Lista horas extras por escopo |
| `hr.overtime.approve.all` / `hr.overtime.approve.team` | Aprova horas extras por escopo |
| `hr.time-entries.list.all` / `hr.time-entries.list.team` | Lista ponto por escopo |
| `hr.time-bank.read.all` / `hr.time-bank.read.team` | Saldo de banco de horas por escopo |

### Permissões sem Escopo (Administrativas)

| Código | Descrição |
|--------|-----------|
| `hr.companies.create` / `hr.companies.manage` | Gestão de empresas |
| `hr.departments.create` / `hr.departments.manage` | Gestão de departamentos |
| `hr.positions.create` / `hr.positions.manage` | Gestão de cargos |
| `hr.work-schedules.create` / `hr.work-schedules.manage` | Gestão de jornadas |
| `hr.payroll.create` / `hr.payroll.process` / `hr.payroll.approve` | Fluxo da folha |
| `hr.payrolls.create` / `hr.payrolls.manage` | Gestão de folhas |
| `hr.bonuses.create` / `hr.deductions.create` | Lançamentos avulsos |
| `hr.company-addresses.create` / `hr.company-cnaes.create` | Subrecursos de empresa |
| `hr.fiscal-settings.create` / `hr.stakeholders.create` | Dados fiscais e societários |
| `hr.employees.terminate` | Desligamento de funcionário |
| `hr.employees.manage` | Suspensão, afastamento e reativação de funcionário |
| `hr.vacation-periods.manage` | Conclusão de período aquisitivo |
| `hr.time-bank.manage` | Ajustes manuais de banco de horas |
| `reports.hr.headcount` | Exportar relatório de quadro de funcionários (CSV) |
| `reports.hr.absences` | Exportar relatório de ausências (CSV) |
| `reports.hr.generate` | Exportar relatório de folha de pagamento (CSV) |

---

## Data Model

Trecho relevante do Prisma schema para as principais entidades HR:

```prisma
// Funcionário
model Employee {
  id                 String    @id @default(uuid())
  tenantId           String    @map("tenant_id")
  registrationNumber String    @map("registration_number")
  userId             String?   @map("user_id")
  fullName           String    @map("full_name")
  socialName         String?   @map("social_name")
  cpf                String
  pis                String?
  hireDate           DateTime  @map("hire_date")
  terminationDate    DateTime? @map("termination_date")
  status             String    // EmployeeStatusEnum
  baseSalary         Float     @map("base_salary")
  contractType       String    @map("contract_type") // ContractTypeEnum
  workRegime         String    @map("work_regime")   // WorkRegimeEnum
  weeklyHours        Int       @map("weekly_hours")
  departmentId       String?   @map("department_id")
  positionId         String?   @map("position_id")
  supervisorId       String?   @map("supervisor_id")
  companyId          String?   @map("company_id")
  emergencyContactInfo Json?   @map("emergency_contact_info")
  healthConditions   Json?     @map("health_conditions")
  metadata           Json      @default("{}")
  pendingIssues      String[]  @map("pending_issues")
  deletedAt          DateTime? @map("deleted_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  @@map("employees")
}

// Modelo polimórfico de Organization
model Organization {
  id               String   @id @default(uuid())
  tenantId         String   @map("tenant_id")
  type             String   // OrganizationType: COMPANY | CUSTOMER
  legalName        String   @map("legal_name")
  cnpj             String?
  cpf              String?
  tradeName        String?  @map("trade_name")
  stateRegistration String? @map("state_registration")
  municipalRegistration String? @map("municipal_registration")
  taxRegime        String?  @map("tax_regime")
  status           String   @default("ACTIVE")
  email            String?
  phoneMain        String?  @map("phone_main")
  website          String?
  typeSpecificData Json?    @map("type_specific_data")
  metadata         Json?
  deletedAt        DateTime? @map("deleted_at")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@map("organizations")
}

// Folha de Pagamento
model Payroll {
  id               String   @id @default(uuid())
  tenantId         String   @map("tenant_id")
  referenceMonth   Int      @map("reference_month")
  referenceYear    Int      @map("reference_year")
  status           String   // PayrollStatusEnum
  totalGross       Float    @map("total_gross")
  totalDeductions  Float    @map("total_deductions")
  totalNet         Float    @map("total_net")
  processedAt      DateTime? @map("processed_at")
  processedBy      String?  @map("processed_by")
  approvedAt       DateTime? @map("approved_at")
  approvedBy       String?  @map("approved_by")
  paidAt           DateTime? @map("paid_at")
  paidBy           String?  @map("paid_by")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  items            PayrollItem[]

  @@map("payrolls")
}
```

---

## Use Cases

### Subdomínios e Use Cases por Grupo

| Subdomínio | Use Cases principais |
|------------|---------------------|
| `employees` | `CreateEmployee`, `GetEmployeeById`, `ListEmployees`, `UpdateEmployee`, `DeleteEmployee`, `TerminateEmployee`, `SuspendEmployee`, `ReactivateEmployee`, `SetEmployeeOnLeave`, `TransferEmployee`, `LinkUserToEmployee`, `CheckEmployeeCpf` |
| `departments` | `CreateDepartment`, `GetDepartmentById`, `ListDepartments`, `UpdateDepartment`, `DeleteDepartment` |
| `positions` | `CreatePosition`, `GetPositionById`, `ListPositions`, `UpdatePosition`, `DeletePosition` |
| `companies` | CRUD completo + `CheckCnpj` |
| `company-addresses` | `CreateCompanyAddress`, `ListCompanyAddresses`, `UpdateCompanyAddress`, `DeleteCompanyAddress` |
| `company-cnaes` | `CreateCompanyCnae`, `GetCompanyCnae`, `GetPrimaryCompanyCnae`, `ListCompanyCnaes`, `UpdateCompanyCnae`, `DeleteCompanyCnae`, `ComputePendingIssues` |
| `company-fiscal-settings` | CRUD completo (singleton por empresa) |
| `company-stakeholder` | CRUD completo |
| `reports` | `ExportEmployeesReport`, `ExportAbsencesReport`, `ExportPayrollReport` |
| `work-schedules` | CRUD completo |
| `time-control` | `ClockIn`, `ClockOut`, `ListTimeEntries`, `CalculateWorkedHours` |
| `absences` | `RequestVacation`, `RequestSickLeave`, `GetAbsence`, `ListAbsences`, `ApproveAbsence`, `RejectAbsence`, `CancelAbsence`, `CalculateVacationBalance` |
| `vacation-periods` | `CreateVacationPeriod`, `GetVacationPeriod`, `ListVacationPeriods`, `ScheduleVacation`, `StartVacation`, `CompleteVacation`, `CancelScheduledVacation`, `SellVacationDays`, `CompleteAcquisition`, `ExpireVacationPeriods` |
| `overtime` | `RequestOvertime`, `GetOvertime`, `ListOvertime`, `ApproveOvertime` |
| `time-bank` | `GetTimeBank`, `ListTimeBanks`, `CreditTimeBank`, `DebitTimeBank`, `AdjustTimeBank` |
| `payrolls` | `CreatePayroll`, `GetPayroll`, `ListPayrolls`, `CalculatePayroll`, `ApprovePayroll`, `CancelPayroll`, `ProcessPayrollPayment` |
| `bonuses` | `CreateBonus`, `GetBonus`, `ListBonuses`, `DeleteBonus` |
| `deductions` | `CreateDeduction`, `GetDeduction`, `ListDeductions`, `DeleteDeduction` |

### Localização das Factories

Todas as factories seguem o padrão `make-{use-case-name}-use-case.ts` dentro de `src/use-cases/hr/{subdomínio}/factories/`.

---

## Tests

- **E2E tests:** 97 arquivos `*.e2e.spec.ts` no diretório `src/http/controllers/hr/`
- **Unit tests:** arquivos `*.spec.ts` nos use cases (nenhum unit test identificado nas factories — use cases testados via E2E)

### Principais subdomínios cobertos por E2E

| Subdomínio | Arquivos E2E |
|------------|-------------|
| employees | 11 (create, create-with-user, check-cpf, get, list, update, delete, terminate, transfer, link-user, suspend, reactivate, set-on-leave) |
| departments | 5 (create, get, list, update, delete) |
| positions | 5 (create, get, list, update, delete) |
| companies | 6 (create, get, list, update, delete, check-cnpj) |
| company-addresses | 4 (create, list, update, delete) |
| company-cnaes | 6 (create, get, get-primary, list, update, delete) |
| company-fiscal-settings | 4 (create, get, update, delete) |
| company-stakeholder | 4 (create, get, update, delete) |
| reports | 3 (export-employees, export-absences, export-payroll) |
| work-schedules | 5 (create, get, list, update, delete) |
| time-control | 4 (clock-in, clock-out, list, calculate-worked-hours) |
| absences | 8 (request-vacation, request-sick-leave, get, list, approve, reject, cancel, vacation-balance) |
| vacation-periods | 9 (create, get, list, schedule, start, complete, cancel, sell-days, complete-acquisition) |
| overtime | 4 (request, get, list, approve) |
| time-bank | 5 (get, list, credit, debit, adjust) |
| payrolls | 7 (create, get, list, calculate, approve, pay, cancel) |
| bonuses | 4 (create, get, list, delete) |
| deductions | 4 (create, get, list, delete) |

### Cenários-chave testados

- Isolamento multi-tenant em todas as entidades (funcionário de tenant A não visível para tenant B)
- Fluxo completo de ausência: solicitação → aprovação → conclusão
- Fluxo completo de folha: criação → cálculo → aprovação → pagamento → cancelamento
- Verificação de duplicidade de CPF e CNPJ dentro do mesmo tenant
- Desligamento de funcionário e bloqueio de reativação
- Abono pecuniário de férias
- Ajuste manual de banco de horas
- Suspensão, afastamento e reativação de funcionário
- Conclusão de período aquisitivo de férias (`complete-acquisition`)
- Exportação CSV de relatórios de funcionários, ausências e folha de pagamento
- Criação de Organization como Company com validação de CNPJ obrigatório

---

## Cron Scripts

| Script | Propósito | Use Case |
|--------|-----------|----------|
| `scripts/expire-vacations-cron.ts` | Expira em lote períodos de férias cujo `concessionEnd` é anterior a hoje | `ExpireVacationPeriodsUseCase` |

O script deve ser executado diariamente por agendador externo. Opera de forma idempotente — pode ser executado múltiplas vezes sem efeitos colaterais.

---

## Tax Tables

Localização: `src/constants/hr/tax-tables.ts`

Exporta:
- `INSS_TABLES: Record<number, INSSTable>` — tabela progressiva com `brackets[]` (limite + alíquota) e `maxContribution`
- `IRRF_TABLES: Record<number, IRRFTable>` — tabela com `exemptLimit` e `brackets[]` (limite + alíquota + parcela a deduzir)
- `getTaxTable(year)` — função auxiliar que retorna a tabela do ano ou, na ausência, a mais recente

Para adicionar novas alíquotas de um ano fiscal, inserir nova chave nos objetos `INSS_TABLES` e `IRRF_TABLES`.

---

## Audit History

| Data | Dimensão | Score | Relatório |
|------|----------|-------|-----------|
| 2026-03-10 | Documentação inicial | — | Gerado pelo doc-writer a partir do código-fonte |
| 2026-03-11 | Atualização — remoção de Supplier/Manufacturer, novos endpoints de status, relatórios CSV, períodos aquisitivos, cron de expiração, audit logging, tabelas fiscais | — | Atualizado pelo doc-writer |
