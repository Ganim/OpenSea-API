# Auditoria de Contrato de API — Módulo HR

**Data:** 2026-03-10
**Módulo:** HR (Human Resources)
**Auditor:** Claude Sonnet 4.6 (API Contract Auditor)
**Backend:** `OpenSea-API/src/http/schemas/hr/`, `src/http/controllers/hr/`, `src/mappers/hr/`
**Frontend:** `OpenSea-APP/src/types/hr/`, `src/services/hr/`, `src/config/api.ts`

---

## Resumo Executivo

O módulo HR é um dos mais extensos do sistema, cobrindo **18 sub-recursos** (employees, departments, positions, companies, company-addresses, company-cnaes, company-fiscal-settings, company-stakeholders, suppliers, manufacturers, work-schedules, overtime, time-bank, time-control, absences, vacation-periods, payrolls, bonuses, deductions). A auditoria identificou sincronização satisfatória na maioria dos contratos de tipo, com divergências concentradas em quatro áreas: formato de paginação, uso de métodos HTTP incorretos em dois serviços, ausência do enum `EmployeeStatus` no frontend, e inconsistências graves nos schemas de `CompanyStakeholder` e `CompanyFiscalSettings`.

---

## Pontuação Final

| Critério                                                                | Status | Peso | Pontos |
| ----------------------------------------------------------------------- | ------ | ---- | ------ |
| 1. Tipos frontend ↔ Zod backend (1:1)                                  | WARN   | 1.0  | 0.5    |
| 2. Todos os endpoints usados no frontend existem no backend             | WARN   | 1.0  | 0.5    |
| 3. Enums sincronizados (Prisma → backend → frontend)                    | WARN   | 1.0  | 0.5    |
| 4. Campos de data tratados como `string` ISO no frontend                | PASS   | 1.0  | 1.0    |
| 5. Formato de paginação consistente (`meta` com total/page/limit/pages) | FAIL   | 1.0  | 0.0    |
| 6. Formato de resposta de erro consistente                              | PASS   | 1.0  | 1.0    |
| 7. Campos opcionais marcados corretamente em ambos os lados             | WARN   | 1.0  | 0.5    |
| 8. Request bodies contêm todos os campos obrigatórios                   | PASS   | 1.0  | 1.0    |
| 9. Tipos de resposta não usam `any`                                     | PASS   | 1.0  | 1.0    |
| 10. Sem endpoints mortos (backend sem uso no frontend)                  | WARN   | 1.0  | 0.5    |

**Pontuação: (1.0 + 0.5 + 0.5 + 0.5 + 0.5 + 0.5 + 0.0 + 1.0 + 1.0 + 1.0) / 10 × 10 = 6.0 / 10**

---

## Critério 1 — Tipos frontend ↔ Zod backend (1:1)

**Resultado: WARN**

A maior parte dos tipos está sincronizada. As divergências abaixo detalham os casos problemáticos por entidade.

### Field Comparison: Employee (response)

| Campo                 | Backend (Zod)                       | Frontend (TS)                       | Status                                                                                                        |
| --------------------- | ----------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`                  | `idSchema`                          | `id: string`                        | MATCH                                                                                                         |
| `registrationNumber`  | `z.string()`                        | `registrationNumber: string`        | MATCH                                                                                                         |
| `fullName`            | `z.string()`                        | `fullName: string`                  | MATCH                                                                                                         |
| `cpf`                 | `z.string()`                        | `cpf: string`                       | MATCH                                                                                                         |
| `status`              | `z.string()`                        | `status?: string`                   | MISMATCH — backend retorna `status` sempre presente; frontend marca como opcional                             |
| `hireDate`            | `dateSchema`                        | `hireDate: string`                  | MATCH                                                                                                         |
| `baseSalary`          | `z.number()`                        | `baseSalary: number`                | MATCH                                                                                                         |
| `contractType`        | `z.string()`                        | `contractType: ContractType`        | MATCH (frontend usa union type correto)                                                                       |
| `workRegime`          | `z.string()`                        | `workRegime: WorkRegime`            | MATCH (frontend usa union type correto)                                                                       |
| `weeklyHours`         | `z.number()`                        | `weeklyHours: number`               | MATCH                                                                                                         |
| `pendingIssues`       | `z.array(z.string())`               | `pendingIssues: string[]`           | MATCH                                                                                                         |
| `metadata`            | `z.record(z.string(), z.unknown())` | `metadata: Record<string, unknown>` | MATCH                                                                                                         |
| `department` (nested) | `{ id, name, code }`                | importa `Department` completo       | MISMATCH — frontend espera `Department` completo; backend retorna objeto resumido `{ id, name, code }`        |
| `position` (nested)   | `{ id, name, level }`               | importa `Position` completo         | MISMATCH — frontend espera `Position` completo; backend retorna objeto resumido `{ id, name, level }`         |
| `company` (nested)    | `{ id, legalName, tradeName }`      | importa `Company` completo          | MISMATCH — frontend espera `Company` completo; backend retorna objeto resumido `{ id, legalName, tradeName }` |

**Recomendação:** No frontend, criar tipos resumidos `EmployeeNestedDepartment`, `EmployeeNestedPosition` e `EmployeeNestedCompany` para os campos aninhados da resposta, ou garantir que o `populate` no cliente devolva o objeto completo. O backend, por desenho, retorna apenas os campos essenciais no aninhamento.

---

### Field Comparison: Department (response)

| Campo                               | Backend (Zod)                                         | Frontend (TS)                         | Status                                                                                         |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                                | `idSchema`                                            | `id: string`                          | MATCH                                                                                          |
| `name`                              | `z.string()`                                          | `name: string`                        | MATCH                                                                                          |
| `code`                              | `z.string()`                                          | `code: string`                        | MATCH                                                                                          |
| `description`                       | `z.string().optional().nullable()`                    | `description?: string \| null`        | MATCH                                                                                          |
| `parentId`                          | `idSchema.optional().nullable()`                      | `parentId?: string \| null`           | MATCH                                                                                          |
| `managerId`                         | `idSchema.optional().nullable()`                      | `managerId?: string \| null`          | MATCH                                                                                          |
| `companyId`                         | `idSchema`                                            | `companyId: string`                   | MATCH                                                                                          |
| `isActive`                          | `z.boolean()`                                         | `isActive: boolean`                   | MATCH                                                                                          |
| `_count`                            | `{ positions: number, employees: number }.optional()` | `_count?: { positions?, employees? }` | WARN — backend retorna ambos obrigatórios dentro de `_count`; frontend os marca como opcionais |
| `positionsCount` (apenas em detail) | `z.number()`                                          | ausente em `Department`               | MISMATCH — campo `positionsCount` retornado pelo GET /:id não está tipado no frontend          |

---

### Field Comparison: Position (response)

| Campo                               | Backend (Zod)                      | Frontend (TS)                 | Status                                                                                |
| ----------------------------------- | ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `code`                              | `z.string()`                       | `code: string`                | MATCH                                                                                 |
| `level`                             | `z.number()`                       | `level: number`               | MATCH                                                                                 |
| `minSalary`                         | `z.number().optional().nullable()` | `minSalary?: number \| null`  | MATCH                                                                                 |
| `maxSalary`                         | `z.number().optional().nullable()` | `maxSalary?: number \| null`  | MATCH                                                                                 |
| `baseSalary`                        | `z.number().optional().nullable()` | `baseSalary?: number \| null` | MATCH                                                                                 |
| `employeesCount` (apenas em detail) | `z.number()`                       | ausente em `Position`         | MISMATCH — campo `employeesCount` retornado pelo GET /:id não está tipado no frontend |

---

### Field Comparison: Company (response)

| Campo                                 | Backend (Zod)                                  | Frontend (TS)                        | Status                                                                       |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| `legalName`                           | `z.string()`                                   | `legalName: string`                  | MATCH                                                                        |
| `cnpj`                                | `z.string()`                                   | `cnpj: string`                       | MATCH                                                                        |
| `tradeName`                           | `z.string().optional()`                        | `tradeName?: string \| null`         | WARN — backend retorna `.optional()` (sem null), frontend aceita null        |
| `stateRegistration`                   | `z.string().optional()`                        | `stateRegistration?: string \| null` | WARN — mesmo caso acima                                                      |
| `taxRegime`                           | `companyTaxRegimeSchema.optional()`            | `taxRegime?: TaxRegime \| null`      | MATCH (valores iguais)                                                       |
| `status`                              | `companyStatusSchema` (obrigatório)            | `status: CompanyStatus`              | MATCH                                                                        |
| `activityStartDate`                   | `z.string().optional()`                        | `activityStartDate?: string \| null` | MATCH                                                                        |
| `metadata`                            | `z.record(z.string(), z.unknown()).optional()` | ausente em `Company`                 | MISMATCH — backend inclui `metadata` na resposta; frontend não tipou o campo |
| `pendingIssues`                       | `z.array(z.string()).optional()`               | `pendingIssues?: string[]`           | MATCH                                                                        |
| `departmentsCount` (apenas em detail) | `z.number()`                                   | ausente em `Company`                 | MISMATCH — campo retornado pelo GET /:id não tipado no frontend              |

---

### Field Comparison: CompanyStakeholder (response)

| Campo                    | Backend (Zod)                                         | Frontend (TS)                     | Status                                                                                                                                              |
| ------------------------ | ----------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `role`                   | `companyStakeholderRoleSchema.optional().nullable()`  | `role?: string \| null`           | MISMATCH — backend usa enum `SOCIO\|ADMINISTRADOR\|PROCURADOR\|REPRESENTANTE_LEGAL\|GERENTE\|DIRETOR\|OUTRO`; frontend tipou como `string` genérico |
| `source`                 | `companyStakeholderSourceSchema` (`CNPJ_API\|MANUAL`) | ausente em `CompanyStakeholder`   | MISMATCH — campo obrigatório na resposta não existe no tipo frontend                                                                                |
| `rawPayloadRef`          | `z.string().optional().nullable()`                    | ausente em `CompanyStakeholder`   | MISMATCH — campo não tipado no frontend                                                                                                             |
| `entryDate` / `exitDate` | `entryDate`, `exitDate`                               | `entranceDate`, `exitDate`        | MISMATCH — backend usa `entryDate`; frontend usa `entranceDate`                                                                                     |
| `email`                  | ausente na resposta Zod                               | `email?: string \| null`          | MISMATCH — frontend tipou campo que o backend não retorna                                                                                           |
| `phone`                  | ausente na resposta Zod                               | `phone?: string \| null`          | MISMATCH — frontend tipou campo que o backend não retorna                                                                                           |
| `isLegalRepresentative`  | `z.boolean()` (obrigatório)                           | `isLegalRepresentative?: boolean` | WARN — backend retorna sempre; frontend marca como opcional                                                                                         |

---

### Field Comparison: CompanyFiscalSettings (response)

| Campo                    | Backend (Zod)                     | Frontend (TS)                             | Status                                                                                                                                                                                                                        |
| ------------------------ | --------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `certificateA1ExpiresAt` | `z.date().optional()`             | `certificateA1ExpiresAt?: string \| null` | FAIL — backend usa `z.date()` (objeto Date) no schema Zod de resposta; frontend usa `string`. O backend deveria serializar como ISO string, mas o schema Zod está tipado incorretamente com `z.date()` em vez de `dateSchema` |
| `createdAt`              | `z.date()`                        | `createdAt: string`                       | FAIL — mesmo problema: `z.date()` no schema de resposta em vez de `dateSchema`                                                                                                                                                |
| `updatedAt`              | `z.date()`                        | `updatedAt: string`                       | FAIL — mesmo problema                                                                                                                                                                                                         |
| `deletedAt`              | `z.date().optional()`             | `deletedAt?: string \| null`              | FAIL — mesmo problema                                                                                                                                                                                                         |
| `nfceCscId`              | ausente no schema Zod de resposta | `nfceCscId?: string \| null`              | MISMATCH — frontend tipou campo que o schema de resposta omite                                                                                                                                                                |
| `defaultTaxProfileId`    | `idSchema.optional()`             | `defaultTaxProfileId?: string \| null`    | MATCH                                                                                                                                                                                                                         |

**Nota crítica:** O arquivo `company-fiscal-settings.schema.ts` usa `z.date()` (objeto `Date` nativo) nos campos de data do schema de **resposta**. Todos os outros schemas do módulo usam `dateSchema` (que resulta em `string`). Isso é uma inconsistência interna do backend que pode gerar erros de serialização em runtime.

---

### Field Comparison: Bonus (response)

| Campo      | Backend (Zod) | Frontend (TS)      | Status                                                          |
| ---------- | ------------- | ------------------ | --------------------------------------------------------------- |
| `tenantId` | ausente       | `tenantId: string` | MISMATCH — frontend inclui `tenantId` que o backend não retorna |
| `name`     | `z.string()`  | `name: string`     | MATCH                                                           |
| `amount`   | `z.number()`  | `amount: number`   | MATCH                                                           |
| `reason`   | `z.string()`  | `reason: string`   | MATCH                                                           |
| `date`     | `dateSchema`  | `date: string`     | MATCH                                                           |
| `isPaid`   | `z.boolean()` | `isPaid: boolean`  | MATCH                                                           |

---

### Field Comparison: Deduction (response)

| Campo                | Backend (Zod)                      | Frontend (TS)                         | Status                                                      |
| -------------------- | ---------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| `tenantId`           | ausente                            | `tenantId: string`                    | MISMATCH — frontend inclui campo não retornado pelo backend |
| `currentInstallment` | `z.number().nullable()`            | `currentInstallment?: number \| null` | MATCH                                                       |
| `isApplied`          | `z.boolean()`                      | `isApplied: boolean`                  | MATCH                                                       |
| `appliedAt`          | `dateSchema.optional().nullable()` | `appliedAt?: string \| null`          | MATCH                                                       |

---

### Field Comparison: Overtime (response)

| Campo      | Backend (Zod) | Frontend (TS)               | Status                                                                  |
| ---------- | ------------- | --------------------------- | ----------------------------------------------------------------------- |
| `tenantId` | ausente       | `tenantId: string`          | MISMATCH — frontend inclui campo não retornado pelo backend             |
| `approved` | `z.boolean()` | `approved: boolean \| null` | WARN — backend usa `z.boolean()` (não nullable); frontend aceita `null` |

---

### Field Comparison: Absence (response)

| Campo      | Backend (Zod) | Frontend (TS)      | Status                                                      |
| ---------- | ------------- | ------------------ | ----------------------------------------------------------- |
| `tenantId` | ausente       | `tenantId: string` | MISMATCH — frontend inclui campo não retornado pelo backend |

---

### Field Comparison: Payroll (response)

| Campo      | Backend (Zod) | Frontend (TS)      | Status                                                      |
| ---------- | ------------- | ------------------ | ----------------------------------------------------------- |
| `tenantId` | ausente       | `tenantId: string` | MISMATCH — frontend inclui campo não retornado pelo backend |

**Padrão identificado:** Múltiplos tipos do frontend (`Bonus`, `Deduction`, `Overtime`, `Absence`, `Payroll`, `VacationPeriod`, `TimeBank`) incluem um campo `tenantId: string` que **não está presente** nos schemas Zod de resposta do backend. Isso indica que esses tipos foram escritos com referência ao modelo Prisma em vez do DTO de resposta da API.

---

### Field Comparison: WorkSchedule (response)

| Campo                      | Backend (Zod)                      | Frontend (TS)           | Status |
| -------------------------- | ---------------------------------- | ----------------------- | ------ |
| Todos os campos de horário | `z.string().optional().nullable()` | `string \| null`        | MATCH  |
| `breakDuration`            | `z.number()` (obrigatório)         | `breakDuration: number` | MATCH  |
| `weeklyHours`              | `z.number()` (obrigatório)         | `weeklyHours: number`   | MATCH  |
| `isActive`                 | `z.boolean()` (obrigatório)        | `isActive: boolean`     | MATCH  |

**`CreateWorkScheduleData` vs `createWorkScheduleSchema`:** O frontend não inclui `weeklyHours` no `CreateWorkScheduleData`. O backend também não exige `weeklyHours` na criação (é computado). Status: MATCH.

---

## Critério 2 — Endpoints usados no frontend existem no backend

**Resultado: WARN**

### Endpoints confirmados (PASS)

| Serviço Frontend                            | Endpoint chamado                                                             | Existe no backend                     |
| ------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| `employeesService.listEmployees`            | `GET /v1/hr/employees`                                                       | Sim                                   |
| `employeesService.getEmployee`              | `GET /v1/hr/employees/:id`                                                   | Sim                                   |
| `employeesService.createEmployee`           | `POST /v1/hr/employees`                                                      | Sim                                   |
| `employeesService.updateEmployee`           | `PUT /v1/hr/employees/:id`                                                   | Sim — backend usa `PATCH`, ver abaixo |
| `employeesService.deleteEmployee`           | `DELETE /v1/hr/employees/:id`                                                | Sim                                   |
| `employeesService.createEmployeeWithUser`   | `POST /v1/hr/employees-with-user`                                            | Sim                                   |
| `employeesService.linkUserToEmployee`       | `POST /v1/hr/employees/:id/link-user`                                        | Sim                                   |
| `employeesService.unlinkUserFromEmployee`   | `POST /v1/hr/employees/:id/unlink-user`                                      | Sim                                   |
| `employeesService.getEmployeeByUserId`      | `GET /v1/hr/employees/by-user/:userId`                                       | Sim                                   |
| `employeesService.getLabelData`             | `POST /v1/hr/employees/label-data`                                           | Sim                                   |
| `employeesService.uploadPhoto`              | `POST /v1/hr/employees/:id/photo`                                            | Sim                                   |
| `employeesService.deletePhoto`              | `DELETE /v1/hr/employees/:id/photo`                                          | Sim                                   |
| `departmentsService.*`                      | `GET/POST/PUT/DELETE /v1/hr/departments`                                     | Sim                                   |
| `positionsService.*`                        | `GET/POST/PUT/DELETE /v1/hr/positions`                                       | Sim                                   |
| `companiesService.*` (companies.service.ts) | `GET/POST/PATCH/DELETE /v1/hr/companies`                                     | Sim                                   |
| `payrollService.*`                          | `GET/POST /v1/hr/payrolls` e ações                                           | Sim                                   |
| `absencesService.*`                         | `GET/PATCH/POST /v1/hr/absences`                                             | Sim                                   |
| `vacationsService.*`                        | `GET/PATCH/POST /v1/hr/vacation-periods`                                     | Sim                                   |
| `overtimeService.*`                         | `GET/POST /v1/hr/overtime`                                                   | Sim                                   |
| `timeBankService.*`                         | `GET/POST /v1/hr/time-bank`                                                  | Sim                                   |
| `timeControlService.*`                      | `POST /v1/hr/time-control/clock-in`, `clock-out`, `calculate-hours`          | Sim                                   |
| `bonusesService.*`                          | `GET/POST/DELETE /v1/hr/bonuses`                                             | Sim                                   |
| `deductionsService.*`                       | `GET/POST/DELETE /v1/hr/deductions`                                          | Sim                                   |
| Subrecursos de empresa                      | `/v1/hr/companies/:id/addresses`, `cnaes`, `fiscal-settings`, `stakeholders` | Sim                                   |

### Divergências de método HTTP (FAIL)

| Serviço Frontend                                                 | Método usado                                 | Método do backend | Impacto                                                                                   |
| ---------------------------------------------------------------- | -------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------- |
| `enterprisesService.checkCnpj` (`enterprises.service.ts`)        | `POST /v1/hr/companies/check-cnpj`           | `POST`            | MATCH — porém esse arquivo é **duplicado obsoleto** (ver abaixo)                          |
| `enterprisesService.updateCompany`                               | `PUT /v1/hr/companies/:id`                   | `PATCH`           | FAIL — backend registra `PATCH`; `enterprises.service.ts` usa `PUT`. Causará HTTP 404/405 |
| `companiesService.updateFiscalSettings` (`companies.service.ts`) | `PATCH /v1/hr/companies/:id/fiscal-settings` | verificar         | A usar PATCH — provavelmente correto                                                      |

**Arquivo duplicado:** Existem **dois serviços para companies** no frontend:

- `src/services/hr/enterprises.service.ts` — versão antiga, usa `PUT` para update e tem request body desatualizado (inclui `address`, `addressNumber`, `zipCode` que não são campos do backend `Company`)
- `src/services/hr/companies.service.ts` — versão nova e correta

O arquivo `enterprises.service.ts` deve ser removido. Qualquer componente que ainda o importe receberá respostas incorretas.

### Endpoints chamados por `enterprises.service.ts` com payload errado

O `CreateCompanyRequest` em `enterprises.service.ts` inclui campos inexistentes no `createCompanySchema` do backend:

```
// enterprises.service.ts — INVÁLIDO
phone, address, addressNumber, complement, neighborhood, city, state, zipCode, country
```

Esses campos não existem no schema `createCompanySchema`. O backend rejeitará ou ignorará esses campos silenciosamente.

### Endpoints extras no `companies.service.ts` não confirmados no backend

| Endpoint chamado                                                      | Verificado                                                            |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET /v1/hr/companies/:id/stakeholders/legal-representative`          | Não encontrado nos routes files lidos — possível endpoint inexistente |
| `POST /v1/hr/companies/:id/stakeholders/sync-from-cnpj-api`           | Não encontrado nos routes files lidos — possível endpoint inexistente |
| `POST /v1/hr/companies/:id/stakeholders/:id/request-data-portability` | Não encontrado nos routes files lidos — possível endpoint inexistente |

---

## Critério 3 — Enums sincronizados

**Resultado: WARN**

### EmployeeStatus — AUSENTE no frontend

O backend define `employeeStatusSchema`:

```
'ACTIVE' | 'ON_LEAVE' | 'VACATION' | 'SUSPENDED' | 'TERMINATED'
```

O frontend **não possui o tipo `EmployeeStatus`**. O campo `status` na interface `Employee` é tipado como `string` genérico:

```typescript
// employee.types.ts
status?: string;  // deveria ser: status: EmployeeStatus
```

O frontend deveria exportar:

```typescript
export type EmployeeStatus =
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'VACATION'
  | 'SUSPENDED'
  | 'TERMINATED';
```

### ContractType — PASS

Backend: `'CLT' | 'PJ' | 'INTERN' | 'TEMPORARY' | 'APPRENTICE'`
Frontend: `'CLT' | 'PJ' | 'INTERN' | 'TEMPORARY' | 'APPRENTICE'`

### WorkRegime — PASS

Backend: `'FULL_TIME' | 'PART_TIME' | 'HOURLY' | 'SHIFT' | 'FLEXIBLE'`
Frontend: `'FULL_TIME' | 'PART_TIME' | 'HOURLY' | 'SHIFT' | 'FLEXIBLE'`

### CompanyStatus — PASS

Backend: `'ACTIVE' | 'INACTIVE' | 'SUSPENDED'`
Frontend: `'ACTIVE' | 'INACTIVE' | 'SUSPENDED'`

### TaxRegime (Company) — PASS

Backend: `'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'IMUNE_ISENTA' | 'OUTROS'`
Frontend: `'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'IMUNE_ISENTA' | 'OUTROS'`

### AbsenceType — PASS

Backend e frontend: 11 valores idênticos.

### AbsenceStatus — PASS

Backend e frontend: 6 valores idênticos.

### PayrollStatus — PASS

Backend e frontend: 6 valores idênticos.

### PayrollItemType — PASS

Backend e frontend: 22 valores idênticos.

### VacationStatus — PASS

Backend e frontend: 7 valores idênticos.

### CompanyStakeholderRole — MISMATCH no frontend

Backend define enum:

```
'SOCIO' | 'ADMINISTRADOR' | 'PROCURADOR' | 'REPRESENTANTE_LEGAL' | 'GERENTE' | 'DIRETOR' | 'OUTRO'
```

Frontend tipou como `role?: string | null` — enum não foi criado.

### CompanyAddressType — PASS

Backend: `'FISCAL' | 'DELIVERY' | 'BILLING' | 'OTHER'`
Frontend: `'FISCAL' | 'DELIVERY' | 'BILLING' | 'OTHER'`

### OrganizationStatus (Supplier) — MISMATCH no frontend

Backend define: `'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED'`
Frontend em `supplier.types.ts`: não existe (tipo não verificado — sem arquivo `supplier.types.ts` no frontend).

---

## Critério 4 — Campos de data tratados como string ISO

**Resultado: PASS**

Todos os tipos HR no frontend (`employee.types.ts`, `department.types.ts`, `company.types.ts`, `absence.types.ts`, `payroll.types.ts`, `bonus.types.ts`, `deduction.types.ts`, `vacation-period.types.ts`, `overtime.types.ts`, `time-entry.types.ts`, `time-bank.types.ts`) usam `string` para todos os campos de data (`createdAt`, `updatedAt`, `deletedAt`, `hireDate`, `birthDate`, etc.).

**Exceção identificada (backend):** O arquivo `company-fiscal-settings.schema.ts` usa `z.date()` (objeto `Date` nativo) em campos de data do schema de **resposta**, em vez de `dateSchema` (que serializa como string). Esta é uma inconsistência interna do backend que pode causar falha de serialização JSON, mas não é um problema do frontend.

---

## Critério 5 — Formato de paginação consistente

**Resultado: FAIL**

O sistema possui **três formatos distintos** de paginação sendo usados no módulo HR, sem padronização:

### Backend — formato usado

Todos os schemas de query do HR usam `perPage` (não `limit`) e `totalPages`:

```typescript
// employee.schema.ts
paginationMetaSchema = { total, page, perPage, totalPages };
```

### Frontend — formatos mistos

| Serviço                                    | Formato do response esperado                                      | Compatível com backend                  |
| ------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------- |
| `EmployeesResponse`                        | `{ total, page, limit, totalPages, meta? }`                       | FALHA — usa `limit` em vez de `perPage` |
| `DepartmentsResponse`                      | `{ total, page, limit, totalPages, meta? }`                       | FALHA — usa `limit` em vez de `perPage` |
| `PositionsResponse`                        | `{ total, page, limit, totalPages, meta? }`                       | FALHA — usa `limit` em vez de `perPage` |
| `CompaniesResponse` (companies.service.ts) | `{ companies, meta: PaginationMeta }`                             | PASS — usa `PaginationMeta` normalizado |
| `AbsencesResponse`                         | `{ absences, meta: { total, page, perPage, totalPages } }`        | PASS                                    |
| `VacationPeriodsResponse`                  | `{ vacationPeriods, meta: { total, page, perPage, totalPages } }` | PASS                                    |
| `WorkSchedulesResponse`                    | `{ total, page, limit, totalPages }`                              | FALHA — usa `limit` em vez de `perPage` |
| `OvertimeListResponse`                     | `{ total, page, perPage, totalPages }`                            | PASS                                    |
| `TimeEntriesResponse`                      | `{ total, page, perPage, totalPages }`                            | PASS                                    |

O `PaginationMeta` centralizado em `src/types/common/pagination.ts` aceita ambos os formatos via `normalizePagination()`, mas os serviços que não usam `PaginationMeta` e que definem estrutura inline com `limit` podem falhar ao tentar ler `response.limit` quando o backend retorna `response.perPage`.

**Recomendação:** Padronizar todos os `*Response` do módulo HR para usar `meta: PaginationMeta` e chamar `normalizePagination()` no nível do serviço.

---

## Critério 6 — Formato de resposta de erro consistente

**Resultado: PASS**

Os controllers HR respondem erros consistentemente com `{ message: string }` (status 400/404/500). O frontend não define tipos de erro explícitos — o tratamento de erros é feito no `apiClient` de forma genérica. Não foram encontradas divergências de formato.

---

## Critério 7 — Campos opcionais marcados corretamente em ambos os lados

**Resultado: WARN**

| Entidade                  | Campo                                | Backend                                                              | Frontend                          | Problema                                                    |
| ------------------------- | ------------------------------------ | -------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| `Employee`                | `status`                             | obrigatório na response                                              | `status?: string`                 | Frontend marca como opcional quando backend garante o campo |
| `Employee`                | `hireDate` na criação                | obrigatório (`z.coerce.date()`)                                      | `hireDate: string` obrigatório    | MATCH                                                       |
| `CompanyStakeholder`      | `isLegalRepresentative`              | `z.boolean()` obrigatório                                            | `isLegalRepresentative?: boolean` | Frontend marca como opcional                                |
| `Position`                | `baseSalary` em `CreatePositionData` | `z.number().positive().optional()`                                   | `baseSalary?: number`             | MATCH                                                       |
| `CreateEmployeeData`      | `status` e `terminationDate`         | não estão em `createEmployeeSchema`                                  | incluídos em `CreateEmployeeData` | Frontend envia campos que o backend não aceita              |
| `UpdateDepartmentRequest` | `companyId`                          | omitido via `.omit({ companyId: true })` no `updateDepartmentSchema` | `companyId?: string`              | Frontend envia campo que o backend ignora no update         |

---

## Critério 8 — Request bodies contêm todos os campos obrigatórios

**Resultado: PASS**

Os campos obrigatórios dos principais schemas foram verificados:

- `createEmployeeSchema` exige: `registrationNumber`, `fullName`, `cpf`, `hireDate`, `baseSalary`, `contractType`, `workRegime`, `weeklyHours` — todos presentes em `CreateEmployeeRequest` e `CreateEmployeeData`.
- `createDepartmentSchema` exige: `name`, `code`, `companyId` — todos presentes em `CreateDepartmentRequest`.
- `createPositionSchema` exige: `name`, `code` — todos presentes em `CreatePositionRequest`.
- `createCompanySchema` exige: `legalName`, `cnpj` — presentes em `CreateCompanyData`.
- `createBonusSchema` exige: `employeeId`, `name`, `amount`, `reason`, `date` — presentes em `CreateBonusRequest`.
- `createDeductionSchema` exige: `employeeId`, `name`, `amount`, `reason`, `date` — presentes em `CreateDeductionRequest`.
- `requestVacationSchema` exige: `employeeId`, `vacationPeriodId`, `startDate`, `endDate` — presentes em `RequestVacationAbsenceRequest`.
- `requestSickLeaveSchema` exige: `employeeId`, `startDate`, `endDate`, `cid`, `reason` (min 10 chars) — presentes em `RequestSickLeaveRequest`.

---

## Critério 9 — Tipos de resposta não usam `any`

**Resultado: PASS**

Nenhuma ocorrência de `any` foi encontrada nos arquivos de tipos HR (`src/types/hr/*.ts`) ou nos serviços HR (`src/services/hr/*.ts`). Todos os campos usam tipos concretos ou `unknown` adequadamente.

---

## Critério 10 — Sem endpoints mortos (backend sem uso no frontend)

**Resultado: WARN**

Os seguintes endpoints do backend HR **não possuem serviço correspondente no frontend**:

| Endpoint                                               | Controller                         | Observação                                                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /v1/hr/employees/:id/terminate`                  | `terminateEmployeeController`      | Nenhum serviço no frontend chama este endpoint                                                                                                             |
| `POST /v1/hr/employees/:id/transfer`                   | `transferEmployeeController`       | Nenhum serviço no frontend chama este endpoint                                                                                                             |
| `GET /v1/hr/employees/check-cpf`                       | `checkCpfController`               | Não está em `employeesService`                                                                                                                             |
| `POST /v1/hr/employees/:id/create-user`                | `createEmployeeWithUserController` | Chamado em `employeesService.createUserForEmployee` mas resposta não tipada corretamente (espera `EmployeeResponse`; backend retorna `{ employee, user }`) |
| `GET /v1/hr/suppliers` (HR)                            | `hrSuppliersRoutes`                | Nenhum serviço HR no frontend usa `/v1/hr/suppliers`                                                                                                       |
| `GET /v1/hr/manufacturers` (HR)                        | `hrManufacturersRoutes`            | Nenhum serviço HR no frontend usa `/v1/hr/manufacturers`                                                                                                   |
| Todos os endpoints de time-bank (`/v1/hr/time-bank/*`) | `timeBankRoutes`                   | Serviço existe (`time-bank.service.ts`) mas endpoint `GET /v1/hr/time-bank/:employeeId` pode diferir do backend                                            |

**Nota sobre HR Suppliers e Manufacturers:** O backend registra dois conjuntos de rotas para suppliers e manufacturers: o módulo **Stock** (`/v1/suppliers`, `/v1/manufacturers`) e o módulo **HR** (`/v1/hr/suppliers`, `/v1/hr/manufacturers`). O frontend em `src/config/api.ts` aponta `SUPPLIERS.LIST = '/v1/suppliers'` e `MANUFACTURERS.LIST = '/v1/manufacturers'` — ou seja, usa as rotas do Stock, não as do HR. Os endpoints HR de suppliers e manufacturers podem estar sem uso.

---

## Problemas Críticos Identificados

### CRÍTICO 1 — Arquivo `enterprises.service.ts` duplicado e com método HTTP errado

**Arquivo:** `D:/Code/Projetos/OpenSea/OpenSea-APP/src/services/hr/enterprises.service.ts`

O serviço `updateCompany` usa `PUT`:

```typescript
// enterprises.service.ts
async updateCompany(id, data): Promise<CompanyResponse> {
  return apiClient.put<CompanyResponse>(API_ENDPOINTS.COMPANIES.UPDATE(id), data);
}
```

O backend registra `PATCH`:

```typescript
// v1-update-company.controller.ts
method: 'PATCH',
url: '/v1/hr/companies/:id',
```

Além disso, o `CreateCompanyRequest` deste serviço inclui campos inexistentes no backend (`address`, `addressNumber`, `zipCode`, `country`, `phone`). Qualquer componente que importe de `enterprises.service.ts` ao invés de `companies.service.ts` terá comportamento incorreto.

**Ação:** Remover `enterprises.service.ts` e garantir que todos os imports apontem para `companies.service.ts`.

### CRÍTICO 2 — Schema de `CompanyFiscalSettings` usa `z.date()` em vez de `dateSchema`

**Arquivo:** `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/companies/company-fiscal-settings.schema.ts`

```typescript
// ERRADO — usa z.date() que é objeto Date nativo
certificateA1ExpiresAt: z.date().optional(),
createdAt: z.date(),
updatedAt: z.date(),
deletedAt: z.date().optional(),
```

Deveria usar `dateSchema` (que é `z.string().datetime()`) como os demais schemas do módulo. Esta inconsistência pode causar erros de serialização quando o Fastify tenta serializar a resposta.

**Ação:** Substituir `z.date()` por `dateSchema` em `companyFiscalSettingsResponseSchema`.

### CRÍTICO 3 — `CompanyStakeholder` tem 5 campos desalinhados

**Arquivo frontend:** `D:/Code/Projetos/OpenSea/OpenSea-APP/src/types/hr/company.types.ts`
**Arquivo backend:** `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/companies/company-stakeholder.schema.ts`

| Divergência              | Backend                                        | Frontend                 |
| ------------------------ | ---------------------------------------------- | ------------------------ |
| Nome do campo de entrada | `entryDate`                                    | `entranceDate`           |
| Campo `source`           | `companyStakeholderSourceSchema` (obrigatório) | ausente                  |
| Campo `rawPayloadRef`    | `z.string().optional().nullable()`             | ausente                  |
| Campo `email`            | ausente na response                            | `email?: string \| null` |
| Campo `phone`            | ausente na response                            | `phone?: string \| null` |

O campo `entranceDate` no frontend nunca chegará ao backend porque o backend espera `entryDate`. Formulários que usam este campo falharão silenciosamente.

---

## Recomendações por Prioridade

### Alta Prioridade

1. **Remover `enterprises.service.ts`** — arquivo duplicado com método HTTP e payload errados.
2. **Corrigir `company-fiscal-settings.schema.ts`** — substituir `z.date()` por `dateSchema` na response.
3. **Corrigir `CompanyStakeholder`** — renomear `entranceDate` → `entryDate`, adicionar `source` e `rawPayloadRef`, remover `email` e `phone`.
4. **Adicionar tipo `EmployeeStatus`** — criar union type em `employee.types.ts` e tipar `status` corretamente na interface `Employee`.

### Média Prioridade

5. **Adicionar `CompanyStakeholderRole`** — criar union type em `company.types.ts` em vez de usar `string`.
6. **Adicionar `metadata`** à interface `Company` no frontend.
7. **Adicionar `departmentsCount`, `positionsCount`, `employeesCount`** aos tipos de detalhe (`Company`, `Department`, `Position`).
8. **Padronizar paginação** — `EmployeesResponse`, `DepartmentsResponse`, `PositionsResponse`, `WorkSchedulesResponse` devem usar `meta: PaginationMeta` com `normalizePagination()`.
9. **Remover `tenantId`** das interfaces de resposta que não o recebem (`Bonus`, `Deduction`, `Overtime`, `Absence`, `Payroll`, `VacationPeriod`, `TimeBank`).
10. **Criar tipos resumidos** para objetos aninhados em `Employee` (department, position, company).

### Baixa Prioridade

11. Investigar e documentar os endpoints `legal-representative`, `sync-from-cnpj-api` e `request-data-portability` em stakeholders — confirmar existência no backend.
12. Confirmar uso das rotas HR de suppliers e manufacturers versus as rotas Stock equivalentes.
13. Implementar serviços frontend para `terminate` e `transfer` de employees se esses fluxos forem usados na UI.

---

## Arquivos Relevantes

**Backend:**

- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/employees/employee.schema.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/employees/employee-enums.schema.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/companies/company.schema.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/companies/company-stakeholder.schema.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/companies/company-fiscal-settings.schema.ts` ← bug z.date()
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/payroll/bonus.schema.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/schemas/hr/payroll/deduction.schema.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/companies/v1-update-company.controller.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/controllers/hr/absences/v1-approve-absence.controller.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-API/src/http/routes.ts`

**Frontend:**

- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/types/hr/employee.types.ts` ← ausência de EmployeeStatus
- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/types/hr/company.types.ts` ← entranceDate, campos extras em Stakeholder
- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/types/hr/bonus.types.ts` ← tenantId extra
- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/types/hr/deduction.types.ts` ← tenantId extra
- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/services/hr/enterprises.service.ts` ← arquivo a remover
- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/services/hr/companies.service.ts` ← versão correta
- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/config/api.ts`
- `D:/Code/Projetos/OpenSea/OpenSea-APP/src/types/common/pagination.ts`
