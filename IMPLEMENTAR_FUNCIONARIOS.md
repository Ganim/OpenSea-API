# 📋 Plano de Implementação - Módulo de RH e Departamento Pessoal

## Sumário

- [Visão Geral](#visão-geral)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Schema do Prisma](#prisma-schema)
- [Fase 1: Gestão Básica de Funcionários](#fase-1-gestão-básica-de-funcionários)
- [Fase 2: Controle de Ponto](#fase-2-controle-de-ponto)
- [Fase 3: Gestão de Ausências](#fase-3-gestão-de-ausências)
- [Fase 4: Folha de Pagamento](#fase-4-folha-de-pagamento)
- [Fase 5: Relatórios e Analytics](#fase-5-relatórios-e-analytics)
- [Roadmap Completo](#roadmap-completo)
- [Conclusão](#conclusão)

---

## Visão Geral

Este documento detalha o plano de implementação do módulo de Recursos Humanos (RH) e Departamento Pessoal para a API OpenSea. O sistema abrangerá gestão de funcionários, controle de ponto, folha de pagamento, férias, faltas, bonificações e demais funcionalidades essenciais para a gestão de pessoas.

### Princípios Arquiteturais

- **DDD (Domain-Driven Design)**: Separação clara entre domínios de negócio
- **Clean Architecture**: Independência de frameworks e testabilidade
- **SOLID**: Princípios de design orientado a objetos
- **Soft Delete**: Todos os registros utilizam `deletedAt` para exclusão lógica
- **Auditoria**: Rastreamento completo de alterações via `AuditLog`
- **Vínculo com Usuário**: Funcionários podem ter um `User` vinculado para controle de acesso

---

## 📁 Estrutura de Pastas

```
src/
├── entities/
│   └── hr/
│       ├── employee.ts
│       ├── department.ts
│       ├── position.ts
│       ├── employee-contract.ts
│       ├── time-entry.ts
│       ├── work-schedule.ts
│       ├── overtime.ts
│       ├── time-bank.ts
│       ├── absence.ts
│       ├── vacation-period.ts
│       ├── payroll.ts
│       ├── payroll-item.ts
│       ├── bonus.ts
│       ├── deduction.ts
│       ├── benefit.ts
│       ├── employee-benefit.ts
│       ├── dtos/
│       │   ├── employee-dtos.ts
│       │   ├── time-entry-dtos.ts
│       │   ├── payroll-dtos.ts
│       │   └── absence-dtos.ts
│       └── value-objects/
│           ├── cpf.ts
│           ├── pis.ts
│           ├── ctps.ts
│           ├── employee-status.ts
│           ├── contract-type.ts
│           ├── work-regime.ts
│           ├── entry-type.ts
│           ├── absence-type.ts
│           ├── absence-status.ts
│           ├── vacation-status.ts
│           ├── payroll-status.ts
│           ├── bonus-type.ts
│           └── salary-range.ts
│
├── use-cases/
│   └── hr/
│       ├── employees/
│       │   ├── create-employee.ts
│       │   ├── create-employee.spec.ts
│       │   ├── update-employee.ts
│       │   ├── list-employees.ts
│       │   ├── get-employee-by-id.ts
│       │   ├── terminate-employee.ts
│       │   ├── transfer-employee.ts
│       │   ├── link-user-to-employee.ts
│       │   └── factories/
│       │       ├── make-create-employee-use-case.ts
│       │       └── ...
│       ├── departments/
│       │   ├── create-department.ts
│       │   ├── update-department.ts
│       │   ├── list-departments.ts
│       │   └── factories/
│       ├── positions/
│       │   ├── create-position.ts
│       │   ├── update-position.ts
│       │   ├── list-positions.ts
│       │   └── factories/
│       ├── time-control/
│       │   ├── clock-in.ts
│       │   ├── clock-out.ts
│       │   ├── list-time-entries.ts
│       │   ├── calculate-worked-hours.ts
│       │   ├── approve-overtime.ts
│       │   ├── manage-time-bank.ts
│       │   └── factories/
│       ├── absences/
│       │   ├── request-vacation.ts
│       │   ├── approve-absence.ts
│       │   ├── register-sick-leave.ts
│       │   ├── calculate-vacation-balance.ts
│       │   ├── list-absences.ts
│       │   └── factories/
│       └── payroll/
│           ├── generate-payroll.ts
│           ├── calculate-payroll-item.ts
│           ├── apply-bonus.ts
│           ├── apply-deduction.ts
│           ├── close-payroll.ts
│           ├── generate-payslip.ts
│           └── factories/
│
├── repositories/
│   └── hr/
│       ├── employees-repository.ts
│       ├── departments-repository.ts
│       ├── positions-repository.ts
│       ├── employee-contracts-repository.ts
│       ├── time-entries-repository.ts
│       ├── work-schedules-repository.ts
│       ├── overtimes-repository.ts
│       ├── time-banks-repository.ts
│       ├── absences-repository.ts
│       ├── vacation-periods-repository.ts
│       ├── payrolls-repository.ts
│       ├── bonuses-repository.ts
│       ├── deductions-repository.ts
│       ├── benefits-repository.ts
│       ├── prisma/
│       │   ├── prisma-employees-repository.ts
│       │   ├── prisma-departments-repository.ts
│       │   └── ...
│       └── in-memory/
│           ├── in-memory-employees-repository.ts
│           ├── in-memory-departments-repository.ts
│           └── ...
│
├── mappers/
│   └── hr/
│       ├── employee/
│       │   ├── employee-mapper.ts
│       │   └── employee-to-dto.ts
│       ├── department/
│       │   └── department-mapper.ts
│       ├── position/
│       │   └── position-mapper.ts
│       ├── time-entry/
│       │   └── time-entry-mapper.ts
│       ├── absence/
│       │   └── absence-mapper.ts
│       └── payroll/
│           └── payroll-mapper.ts
│
└── http/
    ├── controllers/
    │   └── hr/
    │       ├── employees/
    │       │   ├── routes.ts
    │       │   ├── v1-create-employee.controller.ts
    │       │   ├── v1-create-employee.e2e.spec.ts
    │       │   ├── v1-update-employee.controller.ts
    │       │   ├── v1-list-employees.controller.ts
    │       │   ├── v1-get-employee.controller.ts
    │       │   ├── v1-terminate-employee.controller.ts
    │       │   └── v1-link-user-to-employee.controller.ts
    │       ├── departments/
    │       │   ├── routes.ts
    │       │   └── ...
    │       ├── positions/
    │       │   ├── routes.ts
    │       │   └── ...
    │       ├── time-control/
    │       │   ├── routes.ts
    │       │   ├── v1-clock-in.controller.ts
    │       │   ├── v1-clock-out.controller.ts
    │       │   ├── v1-list-time-entries.controller.ts
    │       │   └── v1-approve-overtime.controller.ts
    │       ├── absences/
    │       │   ├── routes.ts
    │       │   ├── v1-request-vacation.controller.ts
    │       │   ├── v1-approve-absence.controller.ts
    │       │   └── v1-list-absences.controller.ts
    │       └── payroll/
    │           ├── routes.ts
    │           ├── v1-generate-payroll.controller.ts
    │           ├── v1-close-payroll.controller.ts
    │           └── v1-generate-payslip.controller.ts
    └── schemas/
        └── hr.schema.ts
```

---

## 🗃️ Prisma Schema

Adicionar ao arquivo `prisma/schema.prisma`:

```prisma
// ===============================================
// HR MODULE - RECURSOS HUMANOS
// ===============================================

// --- Enums ---

enum EmployeeStatus {
  ACTIVE          // Ativo
  ON_LEAVE        // Afastado
  VACATION        // Férias
  SUSPENDED       // Suspenso
  TERMINATED      // Desligado
}

enum ContractType {
  CLT             // Consolidação das Leis do Trabalho
  PJ              // Pessoa Jurídica
  INTERN          // Estagiário
  TEMPORARY       // Temporário
  APPRENTICE      // Jovem Aprendiz
}

enum WorkRegime {
  FULL_TIME       // Tempo integral (44h semanais)
  PART_TIME       // Meio período
  HOURLY          // Horista
  SHIFT           // Escala/Turno
  FLEXIBLE        // Flexível
}

enum EntryType {
  CLOCK_IN        // Entrada
  CLOCK_OUT       // Saída
  BREAK_START     // Início intervalo
  BREAK_END       // Fim intervalo
}

enum AbsenceType {
  VACATION        // Férias
  SICK_LEAVE      // Licença médica
  MATERNITY       // Licença maternidade
  PATERNITY       // Licença paternidade
  BEREAVEMENT     // Luto
  WEDDING         // Casamento (Gala)
  UNPAID_LEAVE    // Licença não remunerada
  UNJUSTIFIED     // Falta injustificada
  JUSTIFIED       // Falta justificada
  COMPENSATORY    // Folga compensatória
  OTHER           // Outros
}

enum AbsenceStatus {
  PENDING         // Pendente de aprovação
  APPROVED        // Aprovada
  REJECTED        // Rejeitada
  CANCELLED       // Cancelada
  IN_PROGRESS     // Em andamento
  COMPLETED       // Concluída
}

enum VacationStatus {
  PENDING         // Período aquisitivo em andamento
  AVAILABLE       // Disponível para gozo
  SCHEDULED       // Agendada
  IN_PROGRESS     // Em gozo
  COMPLETED       // Concluída
  EXPIRED         // Vencida (período concessivo expirado)
  SOLD            // Vendida (abono pecuniário)
}

enum PayrollStatus {
  DRAFT           // Rascunho
  PROCESSING      // Processando
  CALCULATED      // Calculada
  APPROVED        // Aprovada
  PAID            // Paga
  CANCELLED       // Cancelada
}

enum PayrollItemType {
  SALARY          // Salário base
  OVERTIME        // Hora extra
  NIGHT_SHIFT     // Adicional noturno
  HAZARD_PAY      // Insalubridade
  DANGER_PAY      // Periculosidade
  BONUS           // Bonificação
  COMMISSION      // Comissão
  ALLOWANCE       // Vale/Auxílio
  DEDUCTION       // Desconto
  TAX             // Imposto
  BENEFIT         // Benefício
  ADVANCE         // Adiantamento
  OTHER           // Outros
}

enum BonusType {
  PERFORMANCE     // Desempenho
  GOAL            // Meta atingida
  PROFIT_SHARING  // PLR
  ANNUAL          // 13º salário
  REFERRAL        // Indicação
  RETENTION       // Retenção
  SIGNING         // Assinatura de contrato
  SPOT            // Bonificação pontual
  OTHER           // Outros
}

enum BenefitType {
  HEALTH_INSURANCE    // Plano de saúde
  DENTAL_INSURANCE    // Plano odontológico
  LIFE_INSURANCE      // Seguro de vida
  MEAL_VOUCHER        // Vale refeição
  FOOD_VOUCHER        // Vale alimentação
  TRANSPORT_VOUCHER   // Vale transporte
  FUEL_VOUCHER        // Vale combustível
  PARKING             // Estacionamento
  GYM                 // Academia
  DAYCARE             // Auxílio creche
  EDUCATION           // Auxílio educação
  HOME_OFFICE         // Auxílio home office
  PHONE               // Auxílio telefone
  OTHER               // Outros
}

// --- Entidades ---

/// Departamento da empresa
model Department {
  id          String    @id @default(uuid())
  name        String    @db.VarChar(128)
  code        String    @unique @db.VarChar(32)
  description String?   @db.Text
  parentId    String?   @map("parent_id")
  managerId   String?   @map("manager_id")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  parent      Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  manager     Employee?    @relation("DepartmentManager", fields: [managerId], references: [id])
  employees   Employee[]
  positions   Position[]

  @@index([code])
  @@index([parentId])
  @@index([managerId])
  @@index([isActive])
  @@map("departments")
}

/// Cargo/Função
model Position {
  id           String    @id @default(uuid())
  name         String    @db.VarChar(128)
  code         String    @unique @db.VarChar(32)
  description  String?   @db.Text
  departmentId String?   @map("department_id")
  level        Int       @default(1) // Nível hierárquico
  minSalary    Decimal?  @map("min_salary") @db.Decimal(10, 2)
  maxSalary    Decimal?  @map("max_salary") @db.Decimal(10, 2)
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  department Department?         @relation(fields: [departmentId], references: [id])
  employees  Employee[]
  contracts  EmployeeContract[]

  @@index([code])
  @@index([departmentId])
  @@index([level])
  @@index([isActive])
  @@map("positions")
}

/// Funcionário
model Employee {
  id             String         @id @default(uuid())
  userId         String?        @unique @map("user_id") // Vínculo com User para acesso ao sistema
  registrationNumber String     @unique @map("registration_number") @db.VarChar(32) // Matrícula

  // Dados Pessoais
  fullName       String         @map("full_name") @db.VarChar(256)
  socialName     String?        @map("social_name") @db.VarChar(256) // Nome social
  birthDate      DateTime       @map("birth_date") @db.Date
  gender         String?        @db.VarChar(32)
  maritalStatus  String?        @map("marital_status") @db.VarChar(32)
  nationality    String?        @db.VarChar(64)
  birthPlace     String?        @map("birth_place") @db.VarChar(128) // Naturalidade

  // Documentos
  cpf            String         @unique @db.VarChar(14) // 000.000.000-00
  rg             String?        @db.VarChar(20)
  rgIssuer       String?        @map("rg_issuer") @db.VarChar(32)
  rgIssueDate    DateTime?      @map("rg_issue_date") @db.Date
  pis            String?        @unique @db.VarChar(14) // PIS/PASEP
  ctpsNumber     String?        @map("ctps_number") @db.VarChar(32) // Número CTPS
  ctpsSeries     String?        @map("ctps_series") @db.VarChar(16)
  ctpsState      String?        @map("ctps_state") @db.VarChar(2)
  voterTitle     String?        @map("voter_title") @db.VarChar(16) // Título de eleitor
  militaryDoc    String?        @map("military_doc") @db.VarChar(32) // Certificado reservista

  // Contato
  email          String?        @db.VarChar(254)
  personalEmail  String?        @map("personal_email") @db.VarChar(254)
  phone          String?        @db.VarChar(20)
  mobilePhone    String?        @map("mobile_phone") @db.VarChar(20)
  emergencyContact String?      @map("emergency_contact") @db.VarChar(128)
  emergencyPhone String?        @map("emergency_phone") @db.VarChar(20)

  // Endereço
  address        String?        @db.VarChar(256)
  addressNumber  String?        @map("address_number") @db.VarChar(16)
  complement     String?        @db.VarChar(128)
  neighborhood   String?        @db.VarChar(128)
  city           String?        @db.VarChar(128)
  state          String?        @db.VarChar(2)
  zipCode        String?        @map("zip_code") @db.VarChar(10)
  country        String?        @default("Brasil") @db.VarChar(64)

  // Dados Bancários
  bankCode       String?        @map("bank_code") @db.VarChar(8)
  bankName       String?        @map("bank_name") @db.VarChar(128)
  bankAgency     String?        @map("bank_agency") @db.VarChar(16)
  bankAccount    String?        @map("bank_account") @db.VarChar(32)
  bankAccountType String?       @map("bank_account_type") @db.VarChar(32) // Corrente, Poupança
  pixKey         String?        @map("pix_key") @db.VarChar(128)

  // Vínculo
  departmentId   String?        @map("department_id")
  positionId     String?        @map("position_id")
  supervisorId   String?        @map("supervisor_id") // Supervisor direto
  hireDate       DateTime       @map("hire_date") @db.Date
  terminationDate DateTime?     @map("termination_date") @db.Date
  status         EmployeeStatus @default(ACTIVE)

  // Foto
  photoUrl       String?        @map("photo_url") @db.VarChar(512)

  // Metadados flexíveis
  metadata       Json           @default("{}")

  // Auditoria
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  deletedAt      DateTime?      @map("deleted_at")

  // Relations
  user                   User?              @relation(fields: [userId], references: [id])
  department             Department?        @relation(fields: [departmentId], references: [id])
  position               Position?          @relation(fields: [positionId], references: [id])
  supervisor             Employee?          @relation("EmployeeSupervisor", fields: [supervisorId], references: [id])
  subordinates           Employee[]         @relation("EmployeeSupervisor")
  managedDepartments     Department[]       @relation("DepartmentManager")
  contracts              EmployeeContract[]
  timeEntries            TimeEntry[]
  workSchedules          WorkSchedule[]
  overtimes              Overtime[]
  timeBank               TimeBank[]
  absences               Absence[]
  vacationPeriods        VacationPeriod[]
  payrollItems           PayrollItem[]
  bonuses                Bonus[]
  deductions             Deduction[]
  employeeBenefits       EmployeeBenefit[]
  dependents             Dependent[]

  @@index([userId])
  @@index([registrationNumber])
  @@index([cpf])
  @@index([pis])
  @@index([departmentId])
  @@index([positionId])
  @@index([supervisorId])
  @@index([status])
  @@index([hireDate])
  @@index([terminationDate])
  @@map("employees")
}

/// Dependentes do funcionário
model Dependent {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  name         String    @db.VarChar(256)
  relationship String    @db.VarChar(64) // Filho, Cônjuge, etc
  birthDate    DateTime  @map("birth_date") @db.Date
  cpf          String?   @db.VarChar(14)
  isIRDeductible Boolean @default(false) @map("is_ir_deductible") // Dedutível do IR
  isHealthPlanDependent Boolean @default(false) @map("is_health_plan_dependent")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@map("dependents")
}

/// Contrato de trabalho
model EmployeeContract {
  id              String       @id @default(uuid())
  employeeId      String       @map("employee_id")
  positionId      String       @map("position_id")
  contractType    ContractType @map("contract_type")
  workRegime      WorkRegime   @map("work_regime")
  startDate       DateTime     @map("start_date") @db.Date
  endDate         DateTime?    @map("end_date") @db.Date // Null = indeterminado
  trialEndDate    DateTime?    @map("trial_end_date") @db.Date // Fim do período de experiência
  baseSalary      Decimal      @map("base_salary") @db.Decimal(10, 2)
  weeklyHours     Decimal      @map("weekly_hours") @db.Decimal(4, 2) // Ex: 44.00
  monthlyHours    Decimal?     @map("monthly_hours") @db.Decimal(6, 2) // Ex: 220.00
  isActive        Boolean      @default(true) @map("is_active")
  terminationReason String?    @map("termination_reason") @db.Text
  notes           String?      @db.Text
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  deletedAt       DateTime?    @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  position Position @relation(fields: [positionId], references: [id])

  @@index([employeeId])
  @@index([positionId])
  @@index([contractType])
  @@index([isActive])
  @@index([startDate])
  @@index([endDate])
  @@map("employee_contracts")
}

/// Registro de ponto
model TimeEntry {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  entryType    EntryType @map("entry_type")
  timestamp    DateTime  @default(now())
  latitude     Decimal?  @db.Decimal(10, 8)  // Geolocalização
  longitude    Decimal?  @db.Decimal(11, 8)
  ipAddress    String?   @map("ip_address") @db.VarChar(64)
  deviceInfo   String?   @map("device_info") @db.VarChar(256)
  photoUrl     String?   @map("photo_url") @db.VarChar(512) // Foto do ponto
  isManual     Boolean   @default(false) @map("is_manual") // Registro manual
  manualReason String?   @map("manual_reason") @db.VarChar(256)
  approvedBy   String?   @map("approved_by") // User ID que aprovou ajuste
  approvedAt   DateTime? @map("approved_at")
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  approver User?    @relation("TimeEntryApprover", fields: [approvedBy], references: [id])

  @@index([employeeId])
  @@index([entryType])
  @@index([timestamp])
  @@index([employeeId, timestamp])
  @@index([isManual, approvedBy])
  @@map("time_entries")
}

/// Jornada de trabalho
model WorkSchedule {
  id           String   @id @default(uuid())
  employeeId   String   @map("employee_id")
  name         String   @db.VarChar(128) // Ex: "Comercial", "Turno A"
  dayOfWeek    Int      @map("day_of_week") // 0 = Domingo, 6 = Sábado
  startTime    String   @map("start_time") @db.VarChar(5) // HH:MM
  endTime      String   @map("end_time") @db.VarChar(5)
  breakStart   String?  @map("break_start") @db.VarChar(5)
  breakEnd     String?  @map("break_end") @db.VarChar(5)
  isFlexible   Boolean  @default(false) @map("is_flexible")
  flexMinutes  Int?     @map("flex_minutes") // Tolerância em minutos
  validFrom    DateTime @map("valid_from") @db.Date
  validUntil   DateTime? @map("valid_until") @db.Date
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([dayOfWeek])
  @@index([validFrom, validUntil])
  @@index([isActive])
  @@map("work_schedules")
}

/// Hora extra
model Overtime {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  date         DateTime  @db.Date
  startTime    String    @map("start_time") @db.VarChar(5)
  endTime      String    @map("end_time") @db.VarChar(5)
  totalMinutes Int       @map("total_minutes")
  multiplier   Decimal   @db.Decimal(3, 2) // Ex: 1.50, 2.00
  reason       String?   @db.Text
  status       AbsenceStatus @default(PENDING)
  requestedBy  String?   @map("requested_by")
  approvedBy   String?   @map("approved_by")
  approvedAt   DateTime? @map("approved_at")
  rejectionReason String? @map("rejection_reason") @db.Text
  compensateAsTimeBank Boolean @default(false) @map("compensate_as_time_bank")
  payrollId    String?   @map("payroll_id") // Vinculado à folha quando pago
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  requester User?   @relation("OvertimeRequester", fields: [requestedBy], references: [id])
  approver User?    @relation("OvertimeApprover", fields: [approvedBy], references: [id])
  payroll  Payroll? @relation(fields: [payrollId], references: [id])

  @@index([employeeId])
  @@index([date])
  @@index([status])
  @@index([payrollId])
  @@map("overtimes")
}

/// Banco de horas
model TimeBank {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  referenceDate DateTime @map("reference_date") @db.Date
  creditMinutes Int      @map("credit_minutes") // Minutos positivos (horas extras)
  debitMinutes  Int      @map("debit_minutes")  // Minutos negativos (atrasos/saídas)
  balance       Int      // Saldo em minutos
  expiresAt    DateTime? @map("expires_at") @db.Date // Data de expiração do saldo
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([referenceDate])
  @@index([expiresAt])
  @@map("time_bank")
}

/// Ausência (faltas, licenças, afastamentos)
model Absence {
  id           String        @id @default(uuid())
  employeeId   String        @map("employee_id")
  type         AbsenceType
  status       AbsenceStatus @default(PENDING)
  startDate    DateTime      @map("start_date") @db.Date
  endDate      DateTime      @map("end_date") @db.Date
  totalDays    Int           @map("total_days")
  reason       String?       @db.Text
  documentUrl  String?       @map("document_url") @db.VarChar(512) // Atestado, etc
  cid          String?       @db.VarChar(16) // CID (atestado médico)
  isPaid       Boolean       @default(true) @map("is_paid")
  requestId    String?       @map("request_id") // Vínculo com módulo de Requests
  requestedBy  String?       @map("requested_by")
  approvedBy   String?       @map("approved_by")
  approvedAt   DateTime?     @map("approved_at")
  rejectionReason String?    @map("rejection_reason") @db.Text
  notes        String?       @db.Text
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  deletedAt    DateTime?     @map("deleted_at")

  employee  Employee @relation(fields: [employeeId], references: [id])
  requester User?    @relation("AbsenceRequester", fields: [requestedBy], references: [id])
  approver  User?    @relation("AbsenceApprover", fields: [approvedBy], references: [id])
  request   Request? @relation(fields: [requestId], references: [id])

  @@index([employeeId])
  @@index([type])
  @@index([status])
  @@index([startDate, endDate])
  @@index([requestId])
  @@map("absences")
}

/// Período aquisitivo/concessivo de férias
model VacationPeriod {
  id                  String         @id @default(uuid())
  employeeId          String         @map("employee_id")

  // Período Aquisitivo (12 meses de trabalho)
  acquisitionStart    DateTime       @map("acquisition_start") @db.Date
  acquisitionEnd      DateTime       @map("acquisition_end") @db.Date

  // Período Concessivo (12 meses para tirar férias)
  concessionStart     DateTime       @map("concession_start") @db.Date
  concessionEnd       DateTime       @map("concession_end") @db.Date

  // Dias de direito
  totalDays           Int            @map("total_days") @default(30)
  usedDays            Int            @map("used_days") @default(0)
  soldDays            Int            @map("sold_days") @default(0) // Abono pecuniário (max 10)
  remainingDays       Int            @map("remaining_days") @default(30)

  // Controle
  status              VacationStatus @default(PENDING)
  scheduledStart      DateTime?      @map("scheduled_start") @db.Date
  scheduledEnd        DateTime?      @map("scheduled_end") @db.Date
  notes               String?        @db.Text

  createdAt           DateTime       @default(now()) @map("created_at")
  updatedAt           DateTime       @updatedAt @map("updated_at")
  deletedAt           DateTime?      @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([status])
  @@index([acquisitionStart, acquisitionEnd])
  @@index([concessionStart, concessionEnd])
  @@map("vacation_periods")
}

/// Folha de pagamento
model Payroll {
  id             String        @id @default(uuid())
  referenceMonth Int           @map("reference_month") // 1-12
  referenceYear  Int           @map("reference_year")
  status         PayrollStatus @default(DRAFT)

  // Totais
  totalGross     Decimal       @map("total_gross") @db.Decimal(12, 2) // Total bruto
  totalDeductions Decimal      @map("total_deductions") @db.Decimal(12, 2) // Total descontos
  totalNet       Decimal       @map("total_net") @db.Decimal(12, 2) // Total líquido
  totalEmployees Int           @map("total_employees")

  // Encargos
  totalINSS      Decimal?      @map("total_inss") @db.Decimal(12, 2) // Empresa
  totalFGTS      Decimal?      @map("total_fgts") @db.Decimal(12, 2)

  // Controle
  calculatedAt   DateTime?     @map("calculated_at")
  calculatedBy   String?       @map("calculated_by")
  approvedAt     DateTime?     @map("approved_at")
  approvedBy     String?       @map("approved_by")
  paidAt         DateTime?     @map("paid_at")
  paymentDate    DateTime?     @map("payment_date") @db.Date

  notes          String?       @db.Text
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")
  deletedAt      DateTime?     @map("deleted_at")

  items     PayrollItem[]
  overtimes Overtime[]

  @@unique([referenceMonth, referenceYear])
  @@index([status])
  @@index([referenceYear, referenceMonth])
  @@map("payrolls")
}

/// Item da folha de pagamento (por funcionário)
model PayrollItem {
  id             String          @id @default(uuid())
  payrollId      String          @map("payroll_id")
  employeeId     String          @map("employee_id")

  // Salário
  baseSalary     Decimal         @map("base_salary") @db.Decimal(10, 2)
  workedDays     Int             @map("worked_days")
  workedHours    Decimal         @map("worked_hours") @db.Decimal(6, 2)

  // Proventos
  grossSalary    Decimal         @map("gross_salary") @db.Decimal(10, 2) // Salário proporcional
  overtimePay    Decimal         @map("overtime_pay") @db.Decimal(10, 2) @default(0)
  nightShiftPay  Decimal         @map("night_shift_pay") @db.Decimal(10, 2) @default(0)
  hazardPay      Decimal         @map("hazard_pay") @db.Decimal(10, 2) @default(0) // Insalubridade
  dangerPay      Decimal         @map("danger_pay") @db.Decimal(10, 2) @default(0) // Periculosidade
  bonusTotal     Decimal         @map("bonus_total") @db.Decimal(10, 2) @default(0)
  allowanceTotal Decimal         @map("allowance_total") @db.Decimal(10, 2) @default(0) // Auxílios
  otherEarnings  Decimal         @map("other_earnings") @db.Decimal(10, 2) @default(0)
  totalEarnings  Decimal         @map("total_earnings") @db.Decimal(10, 2) // Total proventos

  // Descontos
  inssEmployee   Decimal         @map("inss_employee") @db.Decimal(10, 2) @default(0)
  irrfEmployee   Decimal         @map("irrf_employee") @db.Decimal(10, 2) @default(0)
  transportDiscount Decimal      @map("transport_discount") @db.Decimal(10, 2) @default(0)
  mealDiscount   Decimal         @map("meal_discount") @db.Decimal(10, 2) @default(0)
  healthDiscount Decimal         @map("health_discount") @db.Decimal(10, 2) @default(0)
  advanceDiscount Decimal        @map("advance_discount") @db.Decimal(10, 2) @default(0)
  otherDeductions Decimal        @map("other_deductions") @db.Decimal(10, 2) @default(0)
  totalDeductions Decimal        @map("total_deductions") @db.Decimal(10, 2)

  // Líquido
  netSalary      Decimal         @map("net_salary") @db.Decimal(10, 2)

  // FGTS (encargo empresa)
  fgtsBase       Decimal         @map("fgts_base") @db.Decimal(10, 2) @default(0)
  fgtsAmount     Decimal         @map("fgts_amount") @db.Decimal(10, 2) @default(0)

  // Detalhamento (JSON com breakdown)
  details        Json            @default("{}")

  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")
  deletedAt      DateTime?       @map("deleted_at")

  payroll  Payroll  @relation(fields: [payrollId], references: [id])
  employee Employee @relation(fields: [employeeId], references: [id])

  @@unique([payrollId, employeeId])
  @@index([payrollId])
  @@index([employeeId])
  @@map("payroll_items")
}

/// Bonificação
model Bonus {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  type         BonusType
  description  String    @db.VarChar(256)
  amount       Decimal   @db.Decimal(10, 2)
  referenceMonth Int?    @map("reference_month")
  referenceYear Int?     @map("reference_year")
  paymentDate  DateTime? @map("payment_date") @db.Date
  isPaid       Boolean   @default(false) @map("is_paid")
  payrollId    String?   @map("payroll_id")
  approvedBy   String?   @map("approved_by")
  approvedAt   DateTime? @map("approved_at")
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  approver User?    @relation("BonusApprover", fields: [approvedBy], references: [id])

  @@index([employeeId])
  @@index([type])
  @@index([referenceYear, referenceMonth])
  @@index([isPaid])
  @@map("bonuses")
}

/// Desconto
model Deduction {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  type         String    @db.VarChar(64) // Tipo livre: FALTA, ATRASO, EMPRESTIMO, etc
  description  String    @db.VarChar(256)
  amount       Decimal   @db.Decimal(10, 2)
  referenceMonth Int?    @map("reference_month")
  referenceYear Int?     @map("reference_year")
  isRecurring  Boolean   @default(false) @map("is_recurring") // Desconto recorrente
  installments Int?      // Número de parcelas (se parcelado)
  currentInstallment Int? @map("current_installment")
  isApplied    Boolean   @default(false) @map("is_applied")
  payrollId    String?   @map("payroll_id")
  approvedBy   String?   @map("approved_by")
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  approver User?    @relation("DeductionApprover", fields: [approvedBy], references: [id])

  @@index([employeeId])
  @@index([type])
  @@index([referenceYear, referenceMonth])
  @@index([isApplied])
  @@index([isRecurring])
  @@map("deductions")
}

/// Tipo de benefício disponível
model Benefit {
  id           String      @id @default(uuid())
  name         String      @db.VarChar(128)
  code         String      @unique @db.VarChar(32)
  type         BenefitType
  description  String?     @db.Text
  provider     String?     @db.VarChar(128) // Operadora/Fornecedor

  // Valores padrão
  defaultEmployeeShare Decimal? @map("default_employee_share") @db.Decimal(10, 2)
  defaultCompanyShare  Decimal? @map("default_company_share") @db.Decimal(10, 2)

  isActive     Boolean     @default(true) @map("is_active")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")
  deletedAt    DateTime?   @map("deleted_at")

  employeeBenefits EmployeeBenefit[]

  @@index([code])
  @@index([type])
  @@index([isActive])
  @@map("benefits")
}

/// Benefício do funcionário
model EmployeeBenefit {
  id             String    @id @default(uuid())
  employeeId     String    @map("employee_id")
  benefitId      String    @map("benefit_id")
  startDate      DateTime  @map("start_date") @db.Date
  endDate        DateTime? @map("end_date") @db.Date
  employeeShare  Decimal   @map("employee_share") @db.Decimal(10, 2) // Parte do funcionário
  companyShare   Decimal   @map("company_share") @db.Decimal(10, 2) // Parte da empresa
  isActive       Boolean   @default(true) @map("is_active")
  notes          String?   @db.Text
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  benefit  Benefit  @relation(fields: [benefitId], references: [id])

  @@unique([employeeId, benefitId])
  @@index([employeeId])
  @@index([benefitId])
  @@index([isActive])
  @@map("employee_benefits")
}

// ===============================================
// ATUALIZAÇÕES EM MODELOS EXISTENTES
// ===============================================

// Adicionar ao model User existente:
// - Relation para Employee (1:1 opcional)
// - Relation para TimeEntry (aprovador)
// - Relation para Overtime (solicitante/aprovador)
// - Relation para Absence (solicitante/aprovador)
// - Relation para Bonus (aprovador)
// - Relation para Deduction (aprovador)

// Adicionar ao model Request existente:
// - Relation para Absence (integração com workflow)

// Atualização do Model User (adicionar relations)

model User {
  // ... campos existentes ...

  // HR Module Relations
  employee              Employee?
  approvedTimeEntries   TimeEntry[]   @relation("TimeEntryApprover")
  requestedOvertimes    Overtime[]    @relation("OvertimeRequester")
  approvedOvertimes     Overtime[]    @relation("OvertimeApprover")
  requestedAbsences     Absence[]     @relation("AbsenceRequester")
  approvedAbsences      Absence[]     @relation("AbsenceApprover")
  approvedBonuses       Bonus[]       @relation("BonusApprover")
  approvedDeductions    Deduction[]   @relation("DeductionApprover")
}

// Atualização do Model Request (adicionar relation)

model Request {
  // ... campos existentes ...

  // HR Module Relations
  absences Absence[]
}
```

---

## 🚀 Fase 1: Gestão Básica de Funcionários (Semanas 1-2)

---

## 🗃️ Prisma Schema

Adicionar ao arquivo `prisma/schema.prisma`:

```prisma
// ===============================================
// HR MODULE - RECURSOS HUMANOS
// ===============================================

// --- Enums ---

enum EmployeeStatus {
  ACTIVE          // Ativo
  ON_LEAVE        // Afastado
  VACATION        // Férias
  SUSPENDED       // Suspenso
  TERMINATED      // Desligado
}

enum ContractType {
  CLT             // Consolidação das Leis do Trabalho
  PJ              // Pessoa Jurídica
  INTERN          // Estagiário
  TEMPORARY       // Temporário
  APPRENTICE      // Jovem Aprendiz
}

enum WorkRegime {
  FULL_TIME       // Tempo integral (44h semanais)
  PART_TIME       // Meio período
  HOURLY          // Horista
  SHIFT           // Escala/Turno
  FLEXIBLE        // Flexível
}

enum EntryType {
  CLOCK_IN        // Entrada
  CLOCK_OUT       // Saída
  BREAK_START     // Início intervalo
  BREAK_END       // Fim intervalo
}

enum AbsenceType {
  VACATION        // Férias
  SICK_LEAVE      // Licença médica
  MATERNITY       // Licença maternidade
  PATERNITY       // Licença paternidade
  BEREAVEMENT     // Luto
  WEDDING         // Casamento (Gala)
  UNPAID_LEAVE    // Licença não remunerada
  UNJUSTIFIED     // Falta injustificada
  JUSTIFIED       // Falta justificada
  COMPENSATORY    // Folga compensatória
  OTHER           // Outros
}

enum AbsenceStatus {
  PENDING         // Pendente de aprovação
  APPROVED        // Aprovada
  REJECTED        // Rejeitada
  CANCELLED       // Cancelada
  IN_PROGRESS     // Em andamento
  COMPLETED       // Concluída
}

enum VacationStatus {
  PENDING         // Período aquisitivo em andamento
  AVAILABLE       // Disponível para gozo
  SCHEDULED       // Agendada
  IN_PROGRESS     // Em gozo
  COMPLETED       // Concluída
  EXPIRED         // Vencida (período concessivo expirado)
  SOLD            // Vendida (abono pecuniário)
}

enum PayrollStatus {
  DRAFT           // Rascunho
  PROCESSING      // Processando
  CALCULATED      // Calculada
  APPROVED        // Aprovada
  PAID            // Paga
  CANCELLED       // Cancelada
}

enum PayrollItemType {
  SALARY          // Salário base
  OVERTIME        // Hora extra
  NIGHT_SHIFT     // Adicional noturno
  HAZARD_PAY      // Insalubridade
  DANGER_PAY      // Periculosidade
  BONUS           // Bonificação
  COMMISSION      // Comissão
  ALLOWANCE       // Vale/Auxílio
  DEDUCTION       // Desconto
  TAX             // Imposto
  BENEFIT         // Benefício
  ADVANCE         // Adiantamento
  OTHER           // Outros
}

enum BonusType {
  PERFORMANCE     // Desempenho
  GOAL            // Meta atingida
  PROFIT_SHARING  // PLR
  ANNUAL          // 13º salário
  REFERRAL        // Indicação
  RETENTION       // Retenção
  SIGNING         // Assinatura de contrato
  SPOT            // Bonificação pontual
  OTHER           // Outros
}

enum BenefitType {
  HEALTH_INSURANCE    // Plano de saúde
  DENTAL_INSURANCE    // Plano odontológico
  LIFE_INSURANCE      // Seguro de vida
  MEAL_VOUCHER        // Vale refeição
  FOOD_VOUCHER        // Vale alimentação
  TRANSPORT_VOUCHER   // Vale transporte
  FUEL_VOUCHER        // Vale combustível
  PARKING             // Estacionamento
  GYM                 // Academia
  DAYCARE             // Auxílio creche
  EDUCATION           // Auxílio educação
  HOME_OFFICE         // Auxílio home office
  PHONE               // Auxílio telefone
  OTHER               // Outros
}

// --- Entidades ---

/// Departamento da empresa
model Department {
  id          String    @id @default(uuid())
  name        String    @db.VarChar(128)
  code        String    @unique @db.VarChar(32)
  description String?   @db.Text
  parentId    String?   @map("parent_id")
  managerId   String?   @map("manager_id")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  parent      Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DepartmentHierarchy")
  manager     Employee?    @relation("DepartmentManager", fields: [managerId], references: [id])
  employees   Employee[]
  positions   Position[]

  @@index([code])
  @@index([parentId])
  @@index([managerId])
  @@index([isActive])
  @@map("departments")
}

/// Cargo/Função
model Position {
  id           String    @id @default(uuid())
  name         String    @db.VarChar(128)
  code         String    @unique @db.VarChar(32)
  description  String?   @db.Text
  departmentId String?   @map("department_id")
  level        Int       @default(1) // Nível hierárquico
  minSalary    Decimal?  @map("min_salary") @db.Decimal(10, 2)
  maxSalary    Decimal?  @map("max_salary") @db.Decimal(10, 2)
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  department Department?         @relation(fields: [departmentId], references: [id])
  employees  Employee[]
  contracts  EmployeeContract[]

  @@index([code])
  @@index([departmentId])
  @@index([level])
  @@index([isActive])
  @@map("positions")
}

/// Funcionário
model Employee {
  id             String         @id @default(uuid())
  userId         String?        @unique @map("user_id") // Vínculo com User para acesso ao sistema
  registrationNumber String     @unique @map("registration_number") @db.VarChar(32) // Matrícula

  // Dados Pessoais
  fullName       String         @map("full_name") @db.VarChar(256)
  socialName     String?        @map("social_name") @db.VarChar(256) // Nome social
  birthDate      DateTime       @map("birth_date") @db.Date
  gender         String?        @db.VarChar(32)
  maritalStatus  String?        @map("marital_status") @db.VarChar(32)
  nationality    String?        @db.VarChar(64)
  birthPlace     String?        @map("birth_place") @db.VarChar(128) // Naturalidade

  // Documentos
  cpf            String         @unique @db.VarChar(14) // 000.000.000-00
  rg             String?        @db.VarChar(20)
  rgIssuer       String?        @map("rg_issuer") @db.VarChar(32)
  rgIssueDate    DateTime?      @map("rg_issue_date") @db.Date
  pis            String?        @unique @db.VarChar(14) // PIS/PASEP
  ctpsNumber     String?        @map("ctps_number") @db.VarChar(32) // Número CTPS
  ctpsSeries     String?        @map("ctps_series") @db.VarChar(16)
  ctpsState      String?        @map("ctps_state") @db.VarChar(2)
  voterTitle     String?        @map("voter_title") @db.VarChar(16) // Título de eleitor
  militaryDoc    String?        @map("military_doc") @db.VarChar(32) // Certificado reservista

  // Contato
  email          String?        @db.VarChar(254)
  personalEmail  String?        @map("personal_email") @db.VarChar(254)
  phone          String?        @db.VarChar(20)
  mobilePhone    String?        @map("mobile_phone") @db.VarChar(20)
  emergencyContact String?      @map("emergency_contact") @db.VarChar(128)
  emergencyPhone String?        @map("emergency_phone") @db.VarChar(20)

  // Endereço
  address        String?        @db.VarChar(256)
  addressNumber  String?        @map("address_number") @db.VarChar(16)
  complement     String?        @db.VarChar(128)
  neighborhood   String?        @db.VarChar(128)
  city           String?        @db.VarChar(128)
  state          String?        @db.VarChar(2)
  zipCode        String?        @map("zip_code") @db.VarChar(10)
  country        String?        @default("Brasil") @db.VarChar(64)

  // Dados Bancários
  bankCode       String?        @map("bank_code") @db.VarChar(8)
  bankName       String?        @map("bank_name") @db.VarChar(128)
  bankAgency     String?        @map("bank_agency") @db.VarChar(16)
  bankAccount    String?        @map("bank_account") @db.VarChar(32)
  bankAccountType String?       @map("bank_account_type") @db.VarChar(32) // Corrente, Poupança
  pixKey         String?        @map("pix_key") @db.VarChar(128)

  // Vínculo
  departmentId   String?        @map("department_id")
  positionId     String?        @map("position_id")
  supervisorId   String?        @map("supervisor_id") // Supervisor direto
  hireDate       DateTime       @map("hire_date") @db.Date
  terminationDate DateTime?     @map("termination_date") @db.Date
  status         EmployeeStatus @default(ACTIVE)

  // Foto
  photoUrl       String?        @map("photo_url") @db.VarChar(512)

  // Metadados flexíveis
  metadata       Json           @default("{}")

  // Auditoria
  createdAt      DateTime       @default(now()) @map("created_at")
  updatedAt      DateTime       @updatedAt @map("updated_at")
  deletedAt      DateTime?      @map("deleted_at")

  // Relations
  user                   User?              @relation(fields: [userId], references: [id])
  department             Department?        @relation(fields: [departmentId], references: [id])
  position               Position?          @relation(fields: [positionId], references: [id])
  supervisor             Employee?          @relation("EmployeeSupervisor", fields: [supervisorId], references: [id])
  subordinates           Employee[]         @relation("EmployeeSupervisor")
  managedDepartments     Department[]       @relation("DepartmentManager")
  contracts              EmployeeContract[]
  timeEntries            TimeEntry[]
  workSchedules          WorkSchedule[]
  overtimes              Overtime[]
  timeBank               TimeBank[]
  absences               Absence[]
  vacationPeriods        VacationPeriod[]
  payrollItems           PayrollItem[]
  bonuses                Bonus[]
  deductions             Deduction[]
  employeeBenefits       EmployeeBenefit[]
  dependents             Dependent[]

  @@index([userId])
  @@index([registrationNumber])
  @@index([cpf])
  @@index([pis])
  @@index([departmentId])
  @@index([positionId])
  @@index([supervisorId])
  @@index([status])
  @@index([hireDate])
  @@index([terminationDate])
  @@map("employees")
}

/// Dependentes do funcionário
model Dependent {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  name         String    @db.VarChar(256)
  relationship String    @db.VarChar(64) // Filho, Cônjuge, etc
  birthDate    DateTime  @map("birth_date") @db.Date
  cpf          String?   @db.VarChar(14)
  isIRDeductible Boolean @default(false) @map("is_ir_deductible") // Dedutível do IR
  isHealthPlanDependent Boolean @default(false) @map("is_health_plan_dependent")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@map("dependents")
}

/// Contrato de trabalho
model EmployeeContract {
  id              String       @id @default(uuid())
  employeeId      String       @map("employee_id")
  positionId      String       @map("position_id")
  contractType    ContractType @map("contract_type")
  workRegime      WorkRegime   @map("work_regime")
  startDate       DateTime     @map("start_date") @db.Date
  endDate         DateTime?    @map("end_date") @db.Date // Null = indeterminado
  trialEndDate    DateTime?    @map("trial_end_date") @db.Date // Fim do período de experiência
  baseSalary      Decimal      @map("base_salary") @db.Decimal(10, 2)
  weeklyHours     Decimal      @map("weekly_hours") @db.Decimal(4, 2) // Ex: 44.00
  monthlyHours    Decimal?     @map("monthly_hours") @db.Decimal(6, 2) // Ex: 220.00
  isActive        Boolean      @default(true) @map("is_active")
  terminationReason String?    @map("termination_reason") @db.Text
  notes           String?      @db.Text
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  deletedAt       DateTime?    @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  position Position @relation(fields: [positionId], references: [id])

  @@index([employeeId])
  @@index([positionId])
  @@index([contractType])
  @@index([isActive])
  @@index([startDate])
  @@index([endDate])
  @@map("employee_contracts")
}

/// Registro de ponto
model TimeEntry {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  entryType    EntryType @map("entry_type")
  timestamp    DateTime  @default(now())
  latitude     Decimal?  @db.Decimal(10, 8)  // Geolocalização
  longitude    Decimal?  @db.Decimal(11, 8)
  ipAddress    String?   @map("ip_address") @db.VarChar(64)
  deviceInfo   String?   @map("device_info") @db.VarChar(256)
  photoUrl     String?   @map("photo_url") @db.VarChar(512) // Foto do ponto
  isManual     Boolean   @default(false) @map("is_manual") // Registro manual
  manualReason String?   @map("manual_reason") @db.VarChar(256)
  approvedBy   String?   @map("approved_by") // User ID que aprovou ajuste
  approvedAt   DateTime? @map("approved_at")
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  approver User?    @relation("TimeEntryApprover", fields: [approvedBy], references: [id])

  @@index([employeeId])
  @@index([entryType])
  @@index([timestamp])
  @@index([employeeId, timestamp])
  @@index([isManual, approvedBy])
  @@map("time_entries")
}

/// Jornada de trabalho
model WorkSchedule {
  id           String   @id @default(uuid())
  employeeId   String   @map("employee_id")
  name         String   @db.VarChar(128) // Ex: "Comercial", "Turno A"
  dayOfWeek    Int      @map("day_of_week") // 0 = Domingo, 6 = Sábado
  startTime    String   @map("start_time") @db.VarChar(5) // HH:MM
  endTime      String   @map("end_time") @db.VarChar(5)
  breakStart   String?  @map("break_start") @db.VarChar(5)
  breakEnd     String?  @map("break_end") @db.VarChar(5)
  isFlexible   Boolean  @default(false) @map("is_flexible")
  flexMinutes  Int?     @map("flex_minutes") // Tolerância em minutos
  validFrom    DateTime @map("valid_from") @db.Date
  validUntil   DateTime? @map("valid_until") @db.Date
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([dayOfWeek])
  @@index([validFrom, validUntil])
  @@index([isActive])
  @@map("work_schedules")
}

/// Hora extra
model Overtime {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  date         DateTime  @db.Date
  startTime    String    @map("start_time") @db.VarChar(5)
  endTime      String    @map("end_time") @db.VarChar(5)
  totalMinutes Int       @map("total_minutes")
  multiplier   Decimal   @db.Decimal(3, 2) // Ex: 1.50, 2.00
  reason       String?   @db.Text
  status       AbsenceStatus @default(PENDING)
  requestedBy  String?   @map("requested_by")
  approvedBy   String?   @map("approved_by")
  approvedAt   DateTime? @map("approved_at")
  rejectionReason String? @map("rejection_reason") @db.Text
  compensateAsTimeBank Boolean @default(false) @map("compensate_as_time_bank")
  payrollId    String?   @map("payroll_id") // Vinculado à folha quando pago
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  requester User?   @relation("OvertimeRequester", fields: [requestedBy], references: [id])
  approver User?    @relation("OvertimeApprover", fields: [approvedBy], references: [id])
  payroll  Payroll? @relation(fields: [payrollId], references: [id])

  @@index([employeeId])
  @@index([date])
  @@index([status])
  @@index([payrollId])
  @@map("overtimes")
}

/// Banco de horas
model TimeBank {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  referenceDate DateTime @map("reference_date") @db.Date
  creditMinutes Int      @map("credit_minutes") // Minutos positivos (horas extras)
  debitMinutes  Int      @map("debit_minutes")  // Minutos negativos (atrasos/saídas)
  balance       Int      // Saldo em minutos
  expiresAt    DateTime? @map("expires_at") @db.Date // Data de expiração do saldo
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([referenceDate])
  @@index([expiresAt])
  @@map("time_bank")
}

/// Ausência (faltas, licenças, afastamentos)
model Absence {
  id           String        @id @default(uuid())
  employeeId   String        @map("employee_id")
  type         AbsenceType
  status       AbsenceStatus @default(PENDING)
  startDate    DateTime      @map("start_date") @db.Date
  endDate      DateTime      @map("end_date") @db.Date
  totalDays    Int           @map("total_days")
  reason       String?       @db.Text
  documentUrl  String?       @map("document_url") @db.VarChar(512) // Atestado, etc
  cid          String?       @db.VarChar(16) // CID (atestado médico)
  isPaid       Boolean       @default(true) @map("is_paid")
  requestId    String?       @map("request_id") // Vínculo com módulo de Requests
  requestedBy  String?       @map("requested_by")
  approvedBy   String?       @map("approved_by")
  approvedAt   DateTime?     @map("approved_at")
  rejectionReason String?    @map("rejection_reason") @db.Text
  notes        String?       @db.Text
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  deletedAt    DateTime?     @map("deleted_at")

  employee  Employee @relation(fields: [employeeId], references: [id])
  requester User?    @relation("AbsenceRequester", fields: [requestedBy], references: [id])
  approver  User?    @relation("AbsenceApprover", fields: [approvedBy], references: [id])
  request   Request? @relation(fields: [requestId], references: [id])

  @@index([employeeId])
  @@index([type])
  @@index([status])
  @@index([startDate, endDate])
  @@index([requestId])
  @@map("absences")
}

/// Período aquisitivo/concessivo de férias
model VacationPeriod {
  id                  String         @id @default(uuid())
  employeeId          String         @map("employee_id")

  // Período Aquisitivo (12 meses de trabalho)
  acquisitionStart    DateTime       @map("acquisition_start") @db.Date
  acquisitionEnd      DateTime       @map("acquisition_end") @db.Date

  // Período Concessivo (12 meses para tirar férias)
  concessionStart     DateTime       @map("concession_start") @db.Date
  concessionEnd       DateTime       @map("concession_end") @db.Date

  // Dias de direito
  totalDays           Int            @map("total_days") @default(30)
  usedDays            Int            @map("used_days") @default(0)
  soldDays            Int            @map("sold_days") @default(0) // Abono pecuniário (max 10)
  remainingDays       Int            @map("remaining_days") @default(30)

  // Controle
  status              VacationStatus @default(PENDING)
  scheduledStart      DateTime?      @map("scheduled_start") @db.Date
  scheduledEnd        DateTime?      @map("scheduled_end") @db.Date
  notes               String?        @db.Text

  createdAt           DateTime       @default(now()) @map("created_at")
  updatedAt           DateTime       @updatedAt @map("updated_at")
  deletedAt           DateTime?      @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])

  @@index([employeeId])
  @@index([status])
  @@index([acquisitionStart, acquisitionEnd])
  @@index([concessionStart, concessionEnd])
  @@map("vacation_periods")
}

/// Folha de pagamento
model Payroll {
  id             String        @id @default(uuid())
  referenceMonth Int           @map("reference_month") // 1-12
  referenceYear  Int           @map("reference_year")
  status         PayrollStatus @default(DRAFT)

  // Totais
  totalGross     Decimal       @map("total_gross") @db.Decimal(12, 2) // Total bruto
  totalDeductions Decimal      @map("total_deductions") @db.Decimal(12, 2) // Total descontos
  totalNet       Decimal       @map("total_net") @db.Decimal(12, 2) // Total líquido
  totalEmployees Int           @map("total_employees")

  // Encargos
  totalINSS      Decimal?      @map("total_inss") @db.Decimal(12, 2) // Empresa
  totalFGTS      Decimal?      @map("total_fgts") @db.Decimal(12, 2)

  // Controle
  calculatedAt   DateTime?     @map("calculated_at")
  calculatedBy   String?       @map("calculated_by")
  approvedAt     DateTime?     @map("approved_at")
  approvedBy     String?       @map("approved_by")
  paidAt         DateTime?     @map("paid_at")
  paymentDate    DateTime?     @map("payment_date") @db.Date

  notes          String?       @db.Text
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")
  deletedAt      DateTime?     @map("deleted_at")

  items     PayrollItem[]
  overtimes Overtime[]

  @@unique([referenceMonth, referenceYear])
  @@index([status])
  @@index([referenceYear, referenceMonth])
  @@map("payrolls")
}

/// Item da folha de pagamento (por funcionário)
model PayrollItem {
  id             String          @id @default(uuid())
  payrollId      String          @map("payroll_id")
  employeeId     String          @map("employee_id")

  // Salário
  baseSalary     Decimal         @map("base_salary") @db.Decimal(10, 2)
  workedDays     Int             @map("worked_days")
  workedHours    Decimal         @map("worked_hours") @db.Decimal(6, 2)

  // Proventos
  grossSalary    Decimal         @map("gross_salary") @db.Decimal(10, 2) // Salário proporcional
  overtimePay    Decimal         @map("overtime_pay") @db.Decimal(10, 2) @default(0)
  nightShiftPay  Decimal         @map("night_shift_pay") @db.Decimal(10, 2) @default(0)
  hazardPay      Decimal         @map("hazard_pay") @db.Decimal(10, 2) @default(0) // Insalubridade
  dangerPay      Decimal         @map("danger_pay") @db.Decimal(10, 2) @default(0) // Periculosidade
  bonusTotal     Decimal         @map("bonus_total") @db.Decimal(10, 2) @default(0)
  allowanceTotal Decimal         @map("allowance_total") @db.Decimal(10, 2) @default(0) // Auxílios
  otherEarnings  Decimal         @map("other_earnings") @db.Decimal(10, 2) @default(0)
  totalEarnings  Decimal         @map("total_earnings") @db.Decimal(10, 2) // Total proventos

  // Descontos
  inssEmployee   Decimal         @map("inss_employee") @db.Decimal(10, 2) @default(0)
  irrfEmployee   Decimal         @map("irrf_employee") @db.Decimal(10, 2) @default(0)
  transportDiscount Decimal      @map("transport_discount") @db.Decimal(10, 2) @default(0)
  mealDiscount   Decimal         @map("meal_discount") @db.Decimal(10, 2) @default(0)
  healthDiscount Decimal         @map("health_discount") @db.Decimal(10, 2) @default(0)
  advanceDiscount Decimal        @map("advance_discount") @db.Decimal(10, 2) @default(0)
  otherDeductions Decimal        @map("other_deductions") @db.Decimal(10, 2) @default(0)
  totalDeductions Decimal        @map("total_deductions") @db.Decimal(10, 2)

  // Líquido
  netSalary      Decimal         @map("net_salary") @db.Decimal(10, 2)

  // FGTS (encargo empresa)
  fgtsBase       Decimal         @map("fgts_base") @db.Decimal(10, 2) @default(0)
  fgtsAmount     Decimal         @map("fgts_amount") @db.Decimal(10, 2) @default(0)

  // Detalhamento (JSON com breakdown)
  details        Json            @default("{}")

  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")
  deletedAt      DateTime?       @map("deleted_at")

  payroll  Payroll  @relation(fields: [payrollId], references: [id])
  employee Employee @relation(fields: [employeeId], references: [id])

  @@unique([payrollId, employeeId])
  @@index([payrollId])
  @@index([employeeId])
  @@map("payroll_items")
}

/// Bonificação
model Bonus {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  type         BonusType
  description  String    @db.VarChar(256)
  amount       Decimal   @db.Decimal(10, 2)
  referenceMonth Int?    @map("reference_month")
  referenceYear Int?     @map("reference_year")
  paymentDate  DateTime? @map("payment_date") @db.Date
  isPaid       Boolean   @default(false) @map("is_paid")
  payrollId    String?   @map("payroll_id")
  approvedBy   String?   @map("approved_by")
  approvedAt   DateTime? @map("approved_at")
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  approver User?    @relation("BonusApprover", fields: [approvedBy], references: [id])

  @@index([employeeId])
  @@index([type])
  @@index([referenceYear, referenceMonth])
  @@index([isPaid])
  @@map("bonuses")
}

/// Desconto
model Deduction {
  id           String    @id @default(uuid())
  employeeId   String    @map("employee_id")
  type         String    @db.VarChar(64) // Tipo livre: FALTA, ATRASO, EMPRESTIMO, etc
  description  String    @db.VarChar(256)
  amount       Decimal   @db.Decimal(10, 2)
  referenceMonth Int?    @map("reference_month")
  referenceYear Int?     @map("reference_year")
  isRecurring  Boolean   @default(false) @map("is_recurring") // Desconto recorrente
  installments Int?      // Número de parcelas (se parcelado)
  currentInstallment Int? @map("current_installment")
  isApplied    Boolean   @default(false) @map("is_applied")
  payrollId    String?   @map("payroll_id")
  approvedBy   String?   @map("approved_by")
  notes        String?   @db.Text
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  approver User?    @relation("DeductionApprover", fields: [approvedBy], references: [id])

  @@index([employeeId])
  @@index([type])
  @@index([referenceYear, referenceMonth])
  @@index([isApplied])
  @@index([isRecurring])
  @@map("deductions")
}

/// Tipo de benefício disponível
model Benefit {
  id           String      @id @default(uuid())
  name         String      @db.VarChar(128)
  code         String      @unique @db.VarChar(32)
  type         BenefitType
  description  String?     @db.Text
  provider     String?     @db.VarChar(128) // Operadora/Fornecedor

  // Valores padrão
  defaultEmployeeShare Decimal? @map("default_employee_share") @db.Decimal(10, 2)
  defaultCompanyShare  Decimal? @map("default_company_share") @db.Decimal(10, 2)

  isActive     Boolean     @default(true) @map("is_active")
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")
  deletedAt    DateTime?   @map("deleted_at")

  employeeBenefits EmployeeBenefit[]

  @@index([code])
  @@index([type])
  @@index([isActive])
  @@map("benefits")
}

/// Benefício do funcionário
model EmployeeBenefit {
  id             String    @id @default(uuid())
  employeeId     String    @map("employee_id")
  benefitId      String    @map("benefit_id")
  startDate      DateTime  @map("start_date") @db.Date
  endDate        DateTime? @map("end_date") @db.Date
  employeeShare  Decimal   @map("employee_share") @db.Decimal(10, 2) // Parte do funcionário
  companyShare   Decimal   @map("company_share") @db.Decimal(10, 2) // Parte da empresa
  isActive       Boolean   @default(true) @map("is_active")
  notes          String?   @db.Text
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  employee Employee @relation(fields: [employeeId], references: [id])
  benefit  Benefit  @relation(fields: [benefitId], references: [id])

  @@unique([employeeId, benefitId])
  @@index([employeeId])
  @@index([benefitId])
  @@index([isActive])
  @@map("employee_benefits")
}

// ===============================================
// ATUALIZAÇÕES EM MODELOS EXISTENTES
// ===============================================

// Adicionar ao model User existente:
// - Relation para Employee (1:1 opcional)
// - Relation para TimeEntry (aprovador)
// - Relation para Overtime (solicitante/aprovador)
// - Relation para Absence (solicitante/aprovador)
// - Relation para Bonus (aprovador)
// - Relation para Deduction (aprovador)

// Adicionar ao model Request existente:
// - Relation para Absence (integração com workflow)


Atualização do Model User (adicionar relations)


// Adicionar estas relations ao model User existente:

model User {
  // ... campos existentes ...

  // HR Module Relations
  employee              Employee?
  approvedTimeEntries   TimeEntry[]   @relation("TimeEntryApprover")
  requestedOvertimes    Overtime[]    @relation("OvertimeRequester")
  approvedOvertimes     Overtime[]    @relation("OvertimeApprover")
  requestedAbsences     Absence[]     @relation("AbsenceRequester")
  approvedAbsences      Absence[]     @relation("AbsenceApprover")
  approvedBonuses       Bonus[]       @relation("BonusApprover")
  approvedDeductions    Deduction[]   @relation("DeductionApprover")
}

Atualização do Model Request (adicionar relation)
// Adicionar esta relation ao model Request existente:

model Request {
  // ... campos existentes ...

  // HR Module Relations
  absences Absence[]
}

### 📋 Casos de Uso - Fase 1

#### **Employees Module**

| Use Case | Descrição | Request | Response |
|----------|-----------|---------|----------|
| `CreateEmployeeUseCase` | Criar novo funcionário | `CreateEmployeeDTO` | `Employee` |
| `UpdateEmployeeUseCase` | Atualizar dados do funcionário | `UpdateEmployeeDTO` | `Employee` |
| `GetEmployeeByIdUseCase` | Buscar funcionário por ID | `employeeId: string` | `Employee` |
| `ListEmployeesUseCase` | Listar funcionários com filtros | `ListEmployeesParams` | `Employee[] + meta` |
| `TerminateEmployeeUseCase` | Desligar funcionário | `terminationData` | `Employee` |
| `LinkUserToEmployeeUseCase` | Vincular usuário ao funcionário | `userId, employeeId` | `Employee` |
| `TransferEmployeeUseCase` | Transferir funcionário entre departamentos/cargos | `transferData` | `Employee` |

#### **Departments Module**

| Use Case | Descrição | Request | Response |
|----------|-----------|---------|----------|
| `CreateDepartmentUseCase` | Criar novo departamento | `CreateDepartmentDTO` | `Department` |
| `UpdateDepartmentUseCase` | Atualizar departamento | `UpdateDepartmentDTO` | `Department` |
| `GetDepartmentByIdUseCase` | Buscar departamento por ID | `departmentId: string` | `Department` |
| `ListDepartmentsUseCase` | Listar departamentos | `ListDepartmentsParams` | `Department[] + meta` |
| `DeleteDepartmentUseCase` | Excluir departamento (soft delete) | `departmentId: string` | `void` |

#### **Positions Module**

| Use Case | Descrição | Request | Response |
|----------|-----------|---------|----------|
| `CreatePositionUseCase` | Criar novo cargo | `CreatePositionDTO` | `Position` |
| `UpdatePositionUseCase` | Atualizar cargo | `UpdatePositionDTO` | `Position` |
| `GetPositionByIdUseCase` | Buscar cargo por ID | `positionId: string` | `Position` |
| `ListPositionsUseCase` | Listar cargos | `ListPositionsParams` | `Position[] + meta` |
| `DeletePositionUseCase` | Excluir cargo (soft delete) | `positionId: string` | `void` |
### 🎮 Controllers - Fase 1

#### **Employees Controllers**

| Método | Endpoint | Controller | Descrição |
|--------|----------|------------|-----------|
| `POST` | `/v1/hr/employees` | `v1-create-employee.controller.ts` | Criar funcionário |
| `GET` | `/v1/hr/employees` | `v1-list-employees.controller.ts` | Listar funcionários |
| `GET` | `/v1/hr/employees/:id` | `v1-get-employee.controller.ts` | Buscar funcionário |
| `PUT` | `/v1/hr/employees/:id` | `v1-update-employee.controller.ts` | Atualizar funcionário |
| `POST` | `/v1/hr/employees/:id/terminate` | `v1-terminate-employee.controller.ts` | Desligar funcionário |
| `POST` | `/v1/hr/employees/:id/link-user` | `v1-link-user-to-employee.controller.ts` | Vincular usuário |
| `POST` | `/v1/hr/employees/:id/transfer` | `v1-transfer-employee.controller.ts` | Transferir funcionário |

#### **Departments Controllers**

| Método | Endpoint | Controller | Descrição |
|--------|----------|------------|-----------|
| `POST` | `/v1/hr/departments` | `v1-create-department.controller.ts` | Criar departamento |
| `GET` | `/v1/hr/departments` | `v1-list-departments.controller.ts` | Listar departamentos |
| `GET` | `/v1/hr/departments/:id` | `v1-get-department.controller.ts` | Buscar departamento |
| `PUT` | `/v1/hr/departments/:id` | `v1-update-department.controller.ts` | Atualizar departamento |
| `DELETE` | `/v1/hr/departments/:id` | `v1-delete-department.controller.ts` | Excluir departamento |

#### **Positions Controllers**

| Método | Endpoint | Controller | Descrição |
|--------|----------|------------|-----------|
| `POST` | `/v1/hr/positions` | `v1-create-position.controller.ts` | Criar cargo |
| `GET` | `/v1/hr/positions` | `v1-list-positions.controller.ts` | Listar cargos |
| `PUT` | `/v1/hr/positions/:id` | `v1-update-position.controller.ts` | Atualizar cargo |
| `DELETE` | `/v1/hr/positions/:id` | `v1-delete-position.controller.ts` | Excluir cargo |
```

---

## 🚀 Fase 1: Gestão Básica de Funcionários (Semanas 1-2)

### 📋 Implementação Prática - Ordem Recomendada

1. **Configurar Schema do Prisma** - Adicionar todos os models HR ao `schema.prisma`
2. **Executar Migration** - Criar e aplicar a migration do banco de dados
3. **Implementar Value Objects** - CPF, PIS, Status, Tipos de Contrato, etc.
4. **Implementar Entidades** - Employee, Department, Position com suas regras de negócio
5. **Implementar Repositories** - Interfaces e implementações Prisma/In-Memory
6. **Implementar Mappers** - Conversores entre Domain e Persistence
7. **Implementar Use Cases** - Lógica de negócio para cada operação
8. **Implementar Controllers** - Endpoints HTTP com validação Zod
9. **Implementar Schemas Zod** - Validações de entrada e saída
10. **Testes Unitários** - Cobertura > 80% dos use cases
11. **Testes de Integração** - Controllers e fluxos completos
12. **Documentação Swagger** - Geração automática via schemas

### 📋 Casos de Uso - Fase 1

#### **Employees Module**

| Use Case                    | Descrição                                         | Request               | Response            |
| --------------------------- | ------------------------------------------------- | --------------------- | ------------------- |
| `CreateEmployeeUseCase`     | Criar novo funcionário                            | `CreateEmployeeDTO`   | `Employee`          |
| `UpdateEmployeeUseCase`     | Atualizar dados do funcionário                    | `UpdateEmployeeDTO`   | `Employee`          |
| `GetEmployeeByIdUseCase`    | Buscar funcionário por ID                         | `employeeId: string`  | `Employee`          |
| `ListEmployeesUseCase`      | Listar funcionários com filtros                   | `ListEmployeesParams` | `Employee[] + meta` |
| `TerminateEmployeeUseCase`  | Desligar funcionário                              | `terminationData`     | `Employee`          |
| `LinkUserToEmployeeUseCase` | Vincular usuário ao funcionário                   | `userId, employeeId`  | `Employee`          |
| `TransferEmployeeUseCase`   | Transferir funcionário entre departamentos/cargos | `transferData`        | `Employee`          |

#### **Departments Module**

| Use Case                   | Descrição                          | Request                 | Response              |
| -------------------------- | ---------------------------------- | ----------------------- | --------------------- |
| `CreateDepartmentUseCase`  | Criar novo departamento            | `CreateDepartmentDTO`   | `Department`          |
| `UpdateDepartmentUseCase`  | Atualizar departamento             | `UpdateDepartmentDTO`   | `Department`          |
| `GetDepartmentByIdUseCase` | Buscar departamento por ID         | `departmentId: string`  | `Department`          |
| `ListDepartmentsUseCase`   | Listar departamentos               | `ListDepartmentsParams` | `Department[] + meta` |
| `DeleteDepartmentUseCase`  | Excluir departamento (soft delete) | `departmentId: string`  | `void`                |

#### **Positions Module**

| Use Case                 | Descrição                   | Request               | Response            |
| ------------------------ | --------------------------- | --------------------- | ------------------- |
| `CreatePositionUseCase`  | Criar novo cargo            | `CreatePositionDTO`   | `Position`          |
| `UpdatePositionUseCase`  | Atualizar cargo             | `UpdatePositionDTO`   | `Position`          |
| `GetPositionByIdUseCase` | Buscar cargo por ID         | `positionId: string`  | `Position`          |
| `ListPositionsUseCase`   | Listar cargos               | `ListPositionsParams` | `Position[] + meta` |
| `DeletePositionUseCase`  | Excluir cargo (soft delete) | `positionId: string`  | `void`              |

### 🎮 Controllers - Fase 1

#### **Employees Controllers**

| Método | Endpoint                         | Controller                               | Descrição              |
| ------ | -------------------------------- | ---------------------------------------- | ---------------------- |
| `POST` | `/v1/hr/employees`               | `v1-create-employee.controller.ts`       | Criar funcionário      |
| `GET`  | `/v1/hr/employees`               | `v1-list-employees.controller.ts`        | Listar funcionários    |
| `GET`  | `/v1/hr/employees/:id`           | `v1-get-employee.controller.ts`          | Buscar funcionário     |
| `PUT`  | `/v1/hr/employees/:id`           | `v1-update-employee.controller.ts`       | Atualizar funcionário  |
| `POST` | `/v1/hr/employees/:id/terminate` | `v1-terminate-employee.controller.ts`    | Desligar funcionário   |
| `POST` | `/v1/hr/employees/:id/link-user` | `v1-link-user-to-employee.controller.ts` | Vincular usuário       |
| `POST` | `/v1/hr/employees/:id/transfer`  | `v1-transfer-employee.controller.ts`     | Transferir funcionário |

#### **Departments Controllers**

| Método   | Endpoint                 | Controller                           | Descrição              |
| -------- | ------------------------ | ------------------------------------ | ---------------------- |
| `POST`   | `/v1/hr/departments`     | `v1-create-department.controller.ts` | Criar departamento     |
| `GET`    | `/v1/hr/departments`     | `v1-list-departments.controller.ts`  | Listar departamentos   |
| `GET`    | `/v1/hr/departments/:id` | `v1-get-department.controller.ts`    | Buscar departamento    |
| `PUT`    | `/v1/hr/departments/:id` | `v1-update-department.controller.ts` | Atualizar departamento |
| `DELETE` | `/v1/hr/departments/:id` | `v1-delete-department.controller.ts` | Excluir departamento   |

#### **Positions Controllers**

| Método   | Endpoint               | Controller                         | Descrição       |
| -------- | ---------------------- | ---------------------------------- | --------------- |
| `POST`   | `/v1/hr/positions`     | `v1-create-position.controller.ts` | Criar cargo     |
| `GET`    | `/v1/hr/positions`     | `v1-list-positions.controller.ts`  | Listar cargos   |
| `PUT`    | `/v1/hr/positions/:id` | `v1-update-position.controller.ts` | Atualizar cargo |
| `DELETE` | `/v1/hr/positions/:id` | `v1-delete-position.controller.ts` | Excluir cargo   |

### 📝 Schemas Zod - Fase 1

Adicionar ao arquivo `src/http/schemas/hr.schema.ts`:

```typescript
import { z } from 'zod';

// Enums
export const employeeStatusSchema = z.enum([
  'ACTIVE',
  'ON_LEAVE',
  'VACATION',
  'SUSPENDED',
  'TERMINATED',
]);
export const contractTypeSchema = z.enum([
  'CLT',
  'PJ',
  'INTERN',
  'TEMPORARY',
  'APPRENTICE',
]);
export const workRegimeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'HOURLY',
  'SHIFT',
  'FLEXIBLE',
]);

// Common schemas
export const cpfSchema = z
  .string()
  .regex(
    /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    'CPF deve estar no formato XXX.XXX.XXX-XX',
  )
  .refine((cpf) => {
    // Validação de CPF (implementar lógica)
    return true; // Placeholder
  }, 'CPF inválido');

export const pisSchema = z
  .string()
  .regex(
    /^\d{3}\.\d{5}\.\d{2}-\d{1}$/,
    'PIS deve estar no formato XXX.XXXXX.XX-X',
  )
  .optional();

export const phoneSchema = z
  .string()
  .regex(
    /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    'Telefone deve estar no formato (XX) XXXXX-XXXX',
  )
  .optional();

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX')
  .optional();

// Employee schemas
export const createEmployeeSchema = z.object({
  // Dados pessoais
  fullName: z.string().min(2).max(256),
  socialName: z.string().max(256).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  gender: z.string().max(32).optional(),
  maritalStatus: z.string().max(32).optional(),
  nationality: z.string().max(64).optional(),
  birthPlace: z.string().max(128).optional(),

  // Documentos
  cpf: cpfSchema,
  rg: z.string().max(20).optional(),
  rgIssuer: z.string().max(32).optional(),
  rgIssueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  pis: pisSchema,
  ctpsNumber: z.string().max(32).optional(),
  ctpsSeries: z.string().max(16).optional(),
  ctpsState: z.string().max(2).optional(),
  voterTitle: z.string().max(16).optional(),
  militaryDoc: z.string().max(32).optional(),

  // Contato
  email: z.string().email().optional(),
  personalEmail: z.string().email().optional(),
  phone: phoneSchema,
  mobilePhone: phoneSchema,
  emergencyContact: z.string().max(128).optional(),
  emergencyPhone: phoneSchema,

  // Endereço
  address: z.string().max(256).optional(),
  addressNumber: z.string().max(16).optional(),
  complement: z.string().max(128).optional(),
  neighborhood: z.string().max(128).optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(2).optional(),
  zipCode: zipCodeSchema,
  country: z.string().max(64).default('Brasil'),

  // Dados bancários
  bankCode: z.string().max(8).optional(),
  bankName: z.string().max(128).optional(),
  bankAgency: z.string().max(16).optional(),
  bankAccount: z.string().max(32).optional(),
  bankAccountType: z.string().max(32).optional(),
  pixKey: z.string().max(128).optional(),

  // Vínculo empregatício
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseSalary: z.number().positive(),
  contractType: contractTypeSchema,
  workRegime: workRegimeSchema,
  weeklyHours: z.number().positive().max(168), // Máximo 168h/semana
  photoUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().uuid(),
});

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  status: employeeStatusSchema.optional(),
  search: z.string().optional(), // Busca por nome, CPF, matrícula
});

export const terminateEmployeeSchema = z.object({
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10).max(500),
  notes: z.string().max(1000).optional(),
});

export const linkUserToEmployeeSchema = z.object({
  userId: z.string().uuid(),
});

export const transferEmployeeSchema = z.object({
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10).max(500),
  salaryAdjustment: z.number().optional(), // Novo salário (se houver)
});

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(128),
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Código deve conter apenas letras maiúsculas, números, - e _',
    ),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.string().uuid(),
});

export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Position schemas
export const createPositionSchema = z.object({
  name: z.string().min(2).max(128),
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Código deve conter apenas letras maiúsculas, números, - e _',
    ),
  description: z.string().max(500).optional(),
  departmentId: z.string().uuid().optional(),
  level: z.number().int().positive().default(1),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
});

export const updatePositionSchema = createPositionSchema.partial().extend({
  id: z.string().uuid(),
});

export const listPositionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  departmentId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Response schemas
export const employeeResponseSchema = z.object({
  id: z.string().uuid(),
  registrationNumber: z.string(),
  fullName: z.string(),
  socialName: z.string().nullable(),
  cpf: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  department: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
    })
    .nullable(),
  position: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
    })
    .nullable(),
  supervisor: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable(),
  hireDate: z.string(),
  status: employeeStatusSchema,
  baseSalary: z.number(),
  contractType: contractTypeSchema,
  workRegime: workRegimeSchema,
  photoUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const departmentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  parent: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  manager: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const positionResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  department: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  level: z.number(),
  minSalary: z.number().nullable(),
  maxSalary: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

### 🔄 Mappers - Fase 1

#### **Employee Mapper** (`src/mappers/hr/employee/employee-mapper.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { PIS } from '@/entities/hr/value-objects/pis';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';

export class EmployeeMapper {
  static toDomain(raw: any): Employee {
    return Employee.create(
      {
        registrationNumber: raw.registration_number,
        userId: raw.user_id,
        fullName: raw.full_name,
        socialName: raw.social_name,
        birthDate: raw.birth_date,
        gender: raw.gender,
        maritalStatus: raw.marital_status,
        nationality: raw.nationality,
        birthPlace: raw.birth_place,
        cpf: CPF.create(raw.cpf),
        rg: raw.rg,
        rgIssuer: raw.rg_issuer,
        rgIssueDate: raw.rg_issue_date,
        pis: raw.pis ? PIS.create(raw.pis) : undefined,
        ctpsNumber: raw.ctps_number,
        ctpsSeries: raw.ctps_series,
        ctpsState: raw.ctps_state,
        voterTitle: raw.voter_title,
        militaryDoc: raw.military_doc,
        email: raw.email,
        personalEmail: raw.personal_email,
        phone: raw.phone,
        mobilePhone: raw.mobile_phone,
        emergencyContact: raw.emergency_contact,
        emergencyPhone: raw.emergency_phone,
        address: raw.address,
        addressNumber: raw.address_number,
        complement: raw.complement,
        neighborhood: raw.neighborhood,
        city: raw.city,
        state: raw.state,
        zipCode: raw.zip_code,
        country: raw.country,
        bankCode: raw.bank_code,
        bankName: raw.bank_name,
        bankAgency: raw.bank_agency,
        bankAccount: raw.bank_account,
        bankAccountType: raw.bank_account_type,
        pixKey: raw.pix_key,
        departmentId: raw.department_id,
        positionId: raw.position_id,
        supervisorId: raw.supervisor_id,
        hireDate: raw.hire_date,
        terminationDate: raw.termination_date,
        status: EmployeeStatus.create(raw.status),
        photoUrl: raw.photo_url,
        metadata: raw.metadata || {},
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(employee: Employee): any {
    return {
      id: employee.id.toString(),
      registration_number: employee.registrationNumber,
      user_id: employee.userId,
      full_name: employee.fullName,
      social_name: employee.socialName,
      birth_date: employee.birthDate,
      gender: employee.gender,
      marital_status: employee.maritalStatus,
      nationality: employee.nationality,
      birth_place: employee.birthPlace,
      cpf: employee.cpf.value,
      rg: employee.rg,
      rg_issuer: employee.rgIssuer,
      rg_issue_date: employee.rgIssueDate,
      pis: employee.pis?.value,
      ctps_number: employee.ctpsNumber,
      ctps_series: employee.ctpsSeries,
      ctps_state: employee.ctpsState,
      voter_title: employee.voterTitle,
      military_doc: employee.militaryDoc,
      email: employee.email,
      personal_email: employee.personalEmail,
      phone: employee.phone,
      mobile_phone: employee.mobilePhone,
      emergency_contact: employee.emergencyContact,
      emergency_phone: employee.emergencyPhone,
      address: employee.address,
      address_number: employee.addressNumber,
      complement: employee.complement,
      neighborhood: employee.neighborhood,
      city: employee.city,
      state: employee.state,
      zip_code: employee.zipCode,
      country: employee.country,
      bank_code: employee.bankCode,
      bank_name: employee.bankName,
      bank_agency: employee.bankAgency,
      bank_account: employee.bankAccount,
      bank_account_type: employee.bankAccountType,
      pix_key: employee.pixKey,
      department_id: employee.departmentId,
      position_id: employee.positionId,
      supervisor_id: employee.supervisorId,
      hire_date: employee.hireDate,
      termination_date: employee.terminationDate,
      status: employee.status.value,
      photo_url: employee.photoUrl,
      metadata: employee.metadata,
      created_at: employee.createdAt,
      updated_at: employee.updatedAt,
      deleted_at: employee.deletedAt,
    };
  }
}
```

#### **Employee to DTO** (`src/mappers/hr/employee/employee-to-dto.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';

export interface EmployeeDTO {
  id: string;
  registrationNumber: string;
  userId: string | null;
  fullName: string;
  socialName: string | null;
  birthDate: Date;
  cpf: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  position: {
    id: string;
    name: string;
    code: string;
  } | null;
  supervisor: {
    id: string;
    fullName: string;
  } | null;
  hireDate: Date;
  status: string;
  baseSalary: number;
  contractType: string;
  workRegime: string;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function employeeToDTO(employee: Employee): EmployeeDTO {
  return {
    id: employee.id.toString(),
    registrationNumber: employee.registrationNumber,
    userId: employee.userId,
    fullName: employee.fullName,
    socialName: employee.socialName,
    birthDate: employee.birthDate,
    cpf: employee.cpf.value,
    email: employee.email,
    phone: employee.phone,
    mobilePhone: employee.mobilePhone,
    department: employee.department
      ? {
          id: employee.department.id.toString(),
          name: employee.department.name,
          code: employee.department.code,
        }
      : null,
    position: employee.position
      ? {
          id: employee.position.id.toString(),
          name: employee.position.name,
          code: employee.position.code,
        }
      : null,
    supervisor: employee.supervisor
      ? {
          id: employee.supervisor.id.toString(),
          fullName: employee.supervisor.fullName,
        }
      : null,
    hireDate: employee.hireDate,
    status: employee.status.value,
    baseSalary: employee.baseSalary,
    contractType: employee.contractType.value,
    workRegime: employee.workRegime.value,
    photoUrl: employee.photoUrl,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}
```

#### **Department Mapper** (`src/mappers/hr/department/department-mapper.ts`)

```typescript
import { Department } from '@/entities/hr/department';

export class DepartmentMapper {
  static toDomain(raw: any): Department {
    return Department.create(
      {
        name: raw.name,
        code: raw.code,
        description: raw.description,
        parentId: raw.parent_id,
        managerId: raw.manager_id,
        isActive: raw.is_active,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(department: Department): any {
    return {
      id: department.id.toString(),
      name: department.name,
      code: department.code,
      description: department.description,
      parent_id: department.parentId,
      manager_id: department.managerId,
      is_active: department.isActive,
      created_at: department.createdAt,
      updated_at: department.updatedAt,
      deleted_at: department.deletedAt,
    };
  }
}
```

#### **Position Mapper** (`src/mappers/hr/position/position-mapper.ts`)

```typescript
import { Position } from '@/entities/hr/position';
import { SalaryRange } from '@/entities/hr/value-objects/salary-range';

export class PositionMapper {
  static toDomain(raw: any): Position {
    return Position.create(
      {
        name: raw.name,
        code: raw.code,
        description: raw.description,
        departmentId: raw.department_id,
        level: raw.level,
        salaryRange:
          raw.min_salary && raw.max_salary
            ? SalaryRange.create(raw.min_salary, raw.max_salary)
            : undefined,
        isActive: raw.is_active,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(position: Position): any {
    return {
      id: position.id.toString(),
      name: position.name,
      code: position.code,
      description: position.description,
      department_id: position.departmentId,
      level: position.level,
      min_salary: position.salaryRange?.minSalary,
      max_salary: position.salaryRange?.maxSalary,
      is_active: position.isActive,
      created_at: position.createdAt,
      updated_at: position.updatedAt,
      deleted_at: position.deletedAt,
    };
  }
}
```

### 🗄️ Repositories - Fase 1

#### **Employees Repository Interface** (`src/repositories/hr/employees-repository.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';

export interface FindManyEmployeesParams {
  departmentId?: string;
  positionId?: string;
  supervisorId?: string;
  status?: string;
  search?: string; // Busca por nome, CPF, matrícula
  page?: number;
  limit?: number;
}

export interface EmployeesRepository {
  create(employee: Employee): Promise<void>;
  save(employee: Employee): Promise<void>;
  findById(id: string): Promise<Employee | null>;
  findByCpf(cpf: string): Promise<Employee | null>;
  findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Employee | null>;
  findByUserId(userId: string): Promise<Employee | null>;
  findMany(params: FindManyEmployeesParams): Promise<Employee[]>;
  countMany(
    params: Omit<FindManyEmployeesParams, 'page' | 'limit'>,
  ): Promise<number>;
  delete(id: string): Promise<void>;
}
```

#### **Prisma Employees Repository** (`src/repositories/hr/prisma/prisma-employees-repository.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import { Employee } from '@/entities/hr/employee';
import {
  EmployeesRepository,
  FindManyEmployeesParams,
} from '../employees-repository';
import { EmployeeMapper } from '@/mappers/hr/employee/employee-mapper';

export class PrismaEmployeesRepository implements EmployeesRepository {
  constructor(private prisma: PrismaClient) {}

  async create(employee: Employee): Promise<void> {
    const data = EmployeeMapper.toPrisma(employee);
    await this.prisma.employee.create({ data });
  }

  async save(employee: Employee): Promise<void> {
    const data = EmployeeMapper.toPrisma(employee);
    await this.prisma.employee.update({
      where: { id: employee.id.toString() },
      data,
    });
  }

  async findById(id: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findByCpf(cpf: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { cpf, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { registrationNumber, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findMany(params: FindManyEmployeesParams): Promise<Employee[]> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.positionId) where.positionId = params.positionId;
    if (params.supervisorId) where.supervisorId = params.supervisorId;
    if (params.status) where.status = params.status;

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { cpf: { contains: params.search.replace(/\D/g, '') } },
        { registrationNumber: { contains: params.search } },
      ];
    }

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
      orderBy: [{ hireDate: 'desc' }, { fullName: 'asc' }],
      skip,
      take: limit,
    });

    return employees.map(EmployeeMapper.toDomain);
  }

  async countMany(
    params: Omit<FindManyEmployeesParams, 'page' | 'limit'>,
  ): Promise<number> {
    const where: any = { deletedAt: null };

    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.positionId) where.positionId = params.positionId;
    if (params.supervisorId) where.supervisorId = params.supervisorId;
    if (params.status) where.status = params.status;

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { cpf: { contains: params.search.replace(/\D/g, '') } },
        { registrationNumber: { contains: params.search } },
      ];
    }

    return this.prisma.employee.count({ where });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

#### **In-Memory Employees Repository** (`src/repositories/hr/in-memory/in-memory-employees-repository.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';
import { EmployeesRepository, FindManyEmployeesParams } from '../employees-repository';

export class InMemoryEmployeesRepository implements EmployeesRepository {
  public items: Employee[] = [];

  async create(employee: Employee): Promise<void> {
    this.items.push(employee);
  }

  async save(employee: Employee): Promise<void> {
    const index = this.items.findIndex(item => item.id.equals(employee.id));
    if (index >= 0) {
      this.items[index] = employee;
    }
  }

  async findById(id: string): Promise<Employee | null> {
    return this.items.find(
      item => item.id.toString() === id && !item.deletedAt
    ) ?? null;
  }

  async findByCpf(cpf: string): Promise<Employee | null> {
    return this.items.find(
      item => item.cpf.value === cpf && !item.deletedAt
    ) ?? null;
  }

  async findByRegistrationNumber(registrationNumber: string): Promise<Employee | null> {
    return this.items.find(
      item => item.registrationNumber === registrationNumber && !item.deletedAt
    ) ?? null;
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    return this.items.find(
      item => item.userId === userId && !item.deletedAt
    ) ?? null;
  }

  async findMany(params: FindManyEmployeesParams): Promise<Employee[]> {
    let filtered = this.items.filter(item => !item.deletedAt);

    if (params.departmentId) {
      filtered = filtered.filter(item => item.departmentId === params.departmentId);
    }
    if (params.positionId) {
      filtered = filtered.filter(item => item.positionId === params.positionId);
    }
    if (params.supervisorId) {
      filtered = filtered.filter(item => item.supervisorId === params.supervisorId);
    }
    if (params.status) {
      filtered = filtered.filter(item => item.status.value === params.status);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.fullName.toLowerCase().includes(search) ||
        item.cpf.value.includes(search) ||
        item.registrationNumber.includes(search)
      );
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return filtered.slice(start, end);
  }

  async countMany(params: Omit<FindManyEmployeesParams, 'page' | 'limit'>): Promise<number> {
    let filtered = this.items.filter(item => !item.deletedAt);

    if (params.departmentId) {
      filtered = filtered.filter(item => item.departmentId === params.departmentId);
    }
    if (params.positionId) {
      filtered = filtered.filter(item => item.positionId === params.positionId);
    }
    if (params.supervisorId) {
      filtered = filtered.filter(item => item.supervisorId === params.supervisorId);
    }
    if (params.status) {
      filtered = filtered.filter(item => item.status.value === params.status);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.fullName.toLowerCase().includes(search) ||
        item.cpf.value.includes(search) ||
        item.registrationNumber.includes(search)
      );
    }

    return filtered.length;
}
```

---

## 🚀 Fase 1: Gestão Básica de Funcionários (Semanas 1-2)

### 📋 Implementação Prática - Ordem Recomendada

1. **Configurar Schema do Prisma** - Adicionar todos os models HR ao `schema.prisma`
2. **Executar Migration** - Criar e aplicar a migration do banco de dados
3. **Implementar Value Objects** - CPF, PIS, Status, Tipos de Contrato, etc.
4. **Implementar Entidades** - Employee, Department, Position com suas regras de negócio
5. **Implementar Repositories** - Interfaces e implementações Prisma/In-Memory
6. **Implementar Mappers** - Conversores entre Domain e Persistence
7. **Implementar Use Cases** - Lógica de negócio para cada operação
8. **Implementar Controllers** - Endpoints HTTP com validação Zod
9. **Implementar Schemas Zod** - Validações de entrada e saída
10. **Testes Unitários** - Cobertura > 80% dos use cases
11. **Testes de Integração** - Controllers e fluxos completos
12. **Documentação Swagger** - Geração automática via schemas

### 📋 Casos de Uso - Fase 1

#### **Employees Module**

| Use Case                    | Descrição                                         | Request               | Response            |
| --------------------------- | ------------------------------------------------- | --------------------- | ------------------- |
| `CreateEmployeeUseCase`     | Criar novo funcionário                            | `CreateEmployeeDTO`   | `Employee`          |
| `UpdateEmployeeUseCase`     | Atualizar dados do funcionário                    | `UpdateEmployeeDTO`   | `Employee`          |
| `GetEmployeeByIdUseCase`    | Buscar funcionário por ID                         | `employeeId: string`  | `Employee`          |
| `ListEmployeesUseCase`      | Listar funcionários com filtros                   | `ListEmployeesParams` | `Employee[] + meta` |
| `TerminateEmployeeUseCase`  | Desligar funcionário                              | `terminationData`     | `Employee`          |
| `LinkUserToEmployeeUseCase` | Vincular usuário ao funcionário                   | `userId, employeeId`  | `Employee`          |
| `TransferEmployeeUseCase`   | Transferir funcionário entre departamentos/cargos | `transferData`        | `Employee`          |

#### **Departments Module**

| Use Case                   | Descrição                          | Request                 | Response              |
| -------------------------- | ---------------------------------- | ----------------------- | --------------------- |
| `CreateDepartmentUseCase`  | Criar novo departamento            | `CreateDepartmentDTO`   | `Department`          |
| `UpdateDepartmentUseCase`  | Atualizar departamento             | `UpdateDepartmentDTO`   | `Department`          |
| `GetDepartmentByIdUseCase` | Buscar departamento por ID         | `departmentId: string`  | `Department`          |
| `ListDepartmentsUseCase`   | Listar departamentos               | `ListDepartmentsParams` | `Department[] + meta` |
| `DeleteDepartmentUseCase`  | Excluir departamento (soft delete) | `departmentId: string`  | `void`                |

#### **Positions Module**

| Use Case                 | Descrição                   | Request               | Response            |
| ------------------------ | --------------------------- | --------------------- | ------------------- |
| `CreatePositionUseCase`  | Criar novo cargo            | `CreatePositionDTO`   | `Position`          |
| `UpdatePositionUseCase`  | Atualizar cargo             | `UpdatePositionDTO`   | `Position`          |
| `GetPositionByIdUseCase` | Buscar cargo por ID         | `positionId: string`  | `Position`          |
| `ListPositionsUseCase`   | Listar cargos               | `ListPositionsParams` | `Position[] + meta` |
| `DeletePositionUseCase`  | Excluir cargo (soft delete) | `positionId: string`  | `void`              |

### 🎮 Controllers - Fase 1

#### **Employees Controllers**

| Método | Endpoint                         | Controller                               | Descrição              |
| ------ | -------------------------------- | ---------------------------------------- | ---------------------- |
| `POST` | `/v1/hr/employees`               | `v1-create-employee.controller.ts`       | Criar funcionário      |
| `GET`  | `/v1/hr/employees`               | `v1-list-employees.controller.ts`        | Listar funcionários    |
| `GET`  | `/v1/hr/employees/:id`           | `v1-get-employee.controller.ts`          | Buscar funcionário     |
| `PUT`  | `/v1/hr/employees/:id`           | `v1-update-employee.controller.ts`       | Atualizar funcionário  |
| `POST` | `/v1/hr/employees/:id/terminate` | `v1-terminate-employee.controller.ts`    | Desligar funcionário   |
| `POST` | `/v1/hr/employees/:id/link-user` | `v1-link-user-to-employee.controller.ts` | Vincular usuário       |
| `POST` | `/v1/hr/employees/:id/transfer`  | `v1-transfer-employee.controller.ts`     | Transferir funcionário |

#### **Departments Controllers**

| Método   | Endpoint                 | Controller                           | Descrição              |
| -------- | ------------------------ | ------------------------------------ | ---------------------- |
| `POST`   | `/v1/hr/departments`     | `v1-create-department.controller.ts` | Criar departamento     |
| `GET`    | `/v1/hr/departments`     | `v1-list-departments.controller.ts`  | Listar departamentos   |
| `GET`    | `/v1/hr/departments/:id` | `v1-get-department.controller.ts`    | Buscar departamento    |
| `PUT`    | `/v1/hr/departments/:id` | `v1-update-department.controller.ts` | Atualizar departamento |
| `DELETE` | `/v1/hr/departments/:id` | `v1-delete-department.controller.ts` | Excluir departamento   |

#### **Positions Controllers**

| Método   | Endpoint               | Controller                         | Descrição       |
| -------- | ---------------------- | ---------------------------------- | --------------- |
| `POST`   | `/v1/hr/positions`     | `v1-create-position.controller.ts` | Criar cargo     |
| `GET`    | `/v1/hr/positions`     | `v1-list-positions.controller.ts`  | Listar cargos   |
| `PUT`    | `/v1/hr/positions/:id` | `v1-update-position.controller.ts` | Atualizar cargo |
| `DELETE` | `/v1/hr/positions/:id` | `v1-delete-position.controller.ts` | Excluir cargo   |

### 📝 Schemas Zod - Fase 1

Adicionar ao arquivo `src/http/schemas/hr.schema.ts`:

```typescript
import { z } from 'zod';

// Enums
export const employeeStatusSchema = z.enum([
  'ACTIVE',
  'ON_LEAVE',
  'VACATION',
  'SUSPENDED',
  'TERMINATED',
]);
export const contractTypeSchema = z.enum([
  'CLT',
  'PJ',
  'INTERN',
  'TEMPORARY',
  'APPRENTICE',
]);
export const workRegimeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'HOURLY',
  'SHIFT',
  'FLEXIBLE',
]);

// Common schemas
export const cpfSchema = z
  .string()
  .regex(
    /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    'CPF deve estar no formato XXX.XXX.XXX-XX',
  )
  .refine((cpf) => {
    // Validação de CPF (implementar lógica)
    return true; // Placeholder
  }, 'CPF inválido');

export const pisSchema = z
  .string()
  .regex(
    /^\d{3}\.\d{5}\.\d{2}-\d{1}$/,
    'PIS deve estar no formato XXX.XXXXX.XX-X',
  )
  .optional();

export const phoneSchema = z
  .string()
  .regex(
    /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
    'Telefone deve estar no formato (XX) XXXXX-XXXX',
  )
  .optional();

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato XXXXX-XXX')
  .optional();

// Employee schemas
export const createEmployeeSchema = z.object({
  // Dados pessoais
  fullName: z.string().min(2).max(256),
  socialName: z.string().max(256).optional(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  gender: z.string().max(32).optional(),
  maritalStatus: z.string().max(32).optional(),
  nationality: z.string().max(64).optional(),
  birthPlace: z.string().max(128).optional(),

  // Documentos
  cpf: cpfSchema,
  rg: z.string().max(20).optional(),
  rgIssuer: z.string().max(32).optional(),
  rgIssueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  pis: pisSchema,
  ctpsNumber: z.string().max(32).optional(),
  ctpsSeries: z.string().max(16).optional(),
  ctpsState: z.string().max(2).optional(),
  voterTitle: z.string().max(16).optional(),
  militaryDoc: z.string().max(32).optional(),

  // Contato
  email: z.string().email().optional(),
  personalEmail: z.string().email().optional(),
  phone: phoneSchema,
  mobilePhone: phoneSchema,
  emergencyContact: z.string().max(128).optional(),
  emergencyPhone: phoneSchema,

  // Endereço
  address: z.string().max(256).optional(),
  addressNumber: z.string().max(16).optional(),
  complement: z.string().max(128).optional(),
  neighborhood: z.string().max(128).optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(2).optional(),
  zipCode: zipCodeSchema,
  country: z.string().max(64).default('Brasil'),

  // Dados bancários
  bankCode: z.string().max(8).optional(),
  bankName: z.string().max(128).optional(),
  bankAgency: z.string().max(16).optional(),
  bankAccount: z.string().max(32).optional(),
  bankAccountType: z.string().max(32).optional(),
  pixKey: z.string().max(128).optional(),

  // Vínculo empregatício
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseSalary: z.number().positive(),
  contractType: contractTypeSchema,
  workRegime: workRegimeSchema,
  weeklyHours: z.number().positive().max(168), // Máximo 168h/semana
  photoUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.string().uuid(),
});

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  status: employeeStatusSchema.optional(),
  search: z.string().optional(), // Busca por nome, CPF, matrícula
});

export const terminateEmployeeSchema = z.object({
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10).max(500),
  notes: z.string().max(1000).optional(),
});

export const linkUserToEmployeeSchema = z.object({
  userId: z.string().uuid(),
});

export const transferEmployeeSchema = z.object({
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10).max(500),
  salaryAdjustment: z.number().optional(), // Novo salário (se houver)
});

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(128),
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Código deve conter apenas letras maiúsculas, números, - e _',
    ),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  id: z.string().uuid(),
});

export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Position schemas
export const createPositionSchema = z.object({
  name: z.string().min(2).max(128),
  code: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Código deve conter apenas letras maiúsculas, números, - e _',
    ),
  description: z.string().max(500).optional(),
  departmentId: z.string().uuid().optional(),
  level: z.number().int().positive().default(1),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
});

export const updatePositionSchema = createPositionSchema.partial().extend({
  id: z.string().uuid(),
});

export const listPositionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  departmentId: z.string().uuid().optional(),
  search: z.string().optional(),
});

// Response schemas
export const employeeResponseSchema = z.object({
  id: z.string().uuid(),
  registrationNumber: z.string(),
  fullName: z.string(),
  socialName: z.string().nullable(),
  cpf: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  mobilePhone: z.string().nullable(),
  department: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
    })
    .nullable(),
  position: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
    })
    .nullable(),
  supervisor: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable(),
  hireDate: z.string(),
  status: employeeStatusSchema,
  baseSalary: z.number(),
  contractType: contractTypeSchema,
  workRegime: workRegimeSchema,
  photoUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const departmentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  parent: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  manager: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const positionResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  department: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
  level: z.number(),
  minSalary: z.number().nullable(),
  maxSalary: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
```

### 🔄 Mappers - Fase 1

#### **Employee Mapper** (`src/mappers/hr/employee/employee-mapper.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';
import { CPF } from '@/entities/hr/value-objects/cpf';
import { PIS } from '@/entities/hr/value-objects/pis';
import { EmployeeStatus } from '@/entities/hr/value-objects/employee-status';
import { ContractType } from '@/entities/hr/value-objects/contract-type';
import { WorkRegime } from '@/entities/hr/value-objects/work-regime';

export class EmployeeMapper {
  static toDomain(raw: any): Employee {
    return Employee.create(
      {
        registrationNumber: raw.registration_number,
        userId: raw.user_id,
        fullName: raw.full_name,
        socialName: raw.social_name,
        birthDate: raw.birth_date,
        gender: raw.gender,
        maritalStatus: raw.marital_status,
        nationality: raw.nationality,
        birthPlace: raw.birth_place,
        cpf: CPF.create(raw.cpf),
        rg: raw.rg,
        rgIssuer: raw.rg_issuer,
        rgIssueDate: raw.rg_issue_date,
        pis: raw.pis ? PIS.create(raw.pis) : undefined,
        ctpsNumber: raw.ctps_number,
        ctpsSeries: raw.ctps_series,
        ctpsState: raw.ctps_state,
        voterTitle: raw.voter_title,
        militaryDoc: raw.military_doc,
        email: raw.email,
        personalEmail: raw.personal_email,
        phone: raw.phone,
        mobilePhone: raw.mobile_phone,
        emergencyContact: raw.emergency_contact,
        emergencyPhone: raw.emergency_phone,
        address: raw.address,
        addressNumber: raw.address_number,
        complement: raw.complement,
        neighborhood: raw.neighborhood,
        city: raw.city,
        state: raw.state,
        zipCode: raw.zip_code,
        country: raw.country,
        bankCode: raw.bank_code,
        bankName: raw.bank_name,
        bankAgency: raw.bank_agency,
        bankAccount: raw.bank_account,
        bankAccountType: raw.bank_account_type,
        pixKey: raw.pix_key,
        departmentId: raw.department_id,
        positionId: raw.position_id,
        supervisorId: raw.supervisor_id,
        hireDate: raw.hire_date,
        terminationDate: raw.termination_date,
        status: EmployeeStatus.create(raw.status),
        photoUrl: raw.photo_url,
        metadata: raw.metadata || {},
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(employee: Employee): any {
    return {
      id: employee.id.toString(),
      registration_number: employee.registrationNumber,
      user_id: employee.userId,
      full_name: employee.fullName,
      social_name: employee.socialName,
      birth_date: employee.birthDate,
      gender: employee.gender,
      marital_status: employee.maritalStatus,
      nationality: employee.nationality,
      birth_place: employee.birthPlace,
      cpf: employee.cpf.value,
      rg: employee.rg,
      rg_issuer: employee.rgIssuer,
      rg_issue_date: employee.rgIssueDate,
      pis: employee.pis?.value,
      ctps_number: employee.ctpsNumber,
      ctps_series: employee.ctpsSeries,
      ctps_state: employee.ctpsState,
      voter_title: employee.voterTitle,
      military_doc: employee.militaryDoc,
      email: employee.email,
      personal_email: employee.personalEmail,
      phone: employee.phone,
      mobile_phone: employee.mobilePhone,
      emergency_contact: employee.emergencyContact,
      emergency_phone: employee.emergencyPhone,
      address: employee.address,
      address_number: employee.addressNumber,
      complement: employee.complement,
      neighborhood: employee.neighborhood,
      city: employee.city,
      state: employee.state,
      zip_code: employee.zipCode,
      country: employee.country,
      bank_code: employee.bankCode,
      bank_name: employee.bankName,
      bank_agency: employee.bankAgency,
      bank_account: employee.bankAccount,
      bank_account_type: employee.bankAccountType,
      pix_key: employee.pixKey,
      department_id: employee.departmentId,
      position_id: employee.positionId,
      supervisor_id: employee.supervisorId,
      hire_date: employee.hireDate,
      termination_date: employee.terminationDate,
      status: employee.status.value,
      photo_url: employee.photoUrl,
      metadata: employee.metadata,
      created_at: employee.createdAt,
      updated_at: employee.updatedAt,
      deleted_at: employee.deletedAt,
    };
  }
}
```

#### **Employee to DTO** (`src/mappers/hr/employee/employee-to-dto.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';

export interface EmployeeDTO {
  id: string;
  registrationNumber: string;
  userId: string | null;
  fullName: string;
  socialName: string | null;
  birthDate: Date;
  cpf: string;
  email: string | null;
  phone: string | null;
  mobilePhone: string | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  position: {
    id: string;
    name: string;
    code: string;
  } | null;
  supervisor: {
    id: string;
    fullName: string;
  } | null;
  hireDate: Date;
  status: string;
  baseSalary: number;
  contractType: string;
  workRegime: string;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function employeeToDTO(employee: Employee): EmployeeDTO {
  return {
    id: employee.id.toString(),
    registrationNumber: employee.registrationNumber,
    userId: employee.userId,
    fullName: employee.fullName,
    socialName: employee.socialName,
    birthDate: employee.birthDate,
    cpf: employee.cpf.value,
    email: employee.email,
    phone: employee.phone,
    mobilePhone: employee.mobilePhone,
    department: employee.department
      ? {
          id: employee.department.id.toString(),
          name: employee.department.name,
          code: employee.department.code,
        }
      : null,
    position: employee.position
      ? {
          id: employee.position.id.toString(),
          name: employee.position.name,
          code: employee.position.code,
        }
      : null,
    supervisor: employee.supervisor
      ? {
          id: employee.supervisor.id.toString(),
          fullName: employee.supervisor.fullName,
        }
      : null,
    hireDate: employee.hireDate,
    status: employee.status.value,
    baseSalary: employee.baseSalary,
    contractType: employee.contractType.value,
    workRegime: employee.workRegime.value,
    photoUrl: employee.photoUrl,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}
```

#### **Department Mapper** (`src/mappers/hr/department/department-mapper.ts`)

```typescript
import { Department } from '@/entities/hr/department';

export class DepartmentMapper {
  static toDomain(raw: any): Department {
    return Department.create(
      {
        name: raw.name,
        code: raw.code,
        description: raw.description,
        parentId: raw.parent_id,
        managerId: raw.manager_id,
        isActive: raw.is_active,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(department: Department): any {
    return {
      id: department.id.toString(),
      name: department.name,
      code: department.code,
      description: department.description,
      parent_id: department.parentId,
      manager_id: department.managerId,
      is_active: department.isActive,
      created_at: department.createdAt,
      updated_at: department.updatedAt,
      deleted_at: department.deletedAt,
    };
  }
}
```

#### **Position Mapper** (`src/mappers/hr/position/position-mapper.ts`)

```typescript
import { Position } from '@/entities/hr/position';
import { SalaryRange } from '@/entities/hr/value-objects/salary-range';

export class PositionMapper {
  static toDomain(raw: any): Position {
    return Position.create(
      {
        name: raw.name,
        code: raw.code,
        description: raw.description,
        departmentId: raw.department_id,
        level: raw.level,
        salaryRange:
          raw.min_salary && raw.max_salary
            ? SalaryRange.create(raw.min_salary, raw.max_salary)
            : undefined,
        isActive: raw.is_active,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(position: Position): any {
    return {
      id: position.id.toString(),
      name: position.name,
      code: position.code,
      description: position.description,
      department_id: position.departmentId,
      level: position.level,
      min_salary: position.salaryRange?.minSalary,
      max_salary: position.salaryRange?.maxSalary,
      is_active: position.isActive,
      created_at: position.createdAt,
      updated_at: position.updatedAt,
      deleted_at: position.deletedAt,
    };
  }
}
```

### 🗄️ Repositories - Fase 1

#### **Employees Repository Interface** (`src/repositories/hr/employees-repository.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';

export interface FindManyEmployeesParams {
  departmentId?: string;
  positionId?: string;
  supervisorId?: string;
  status?: string;
  search?: string; // Busca por nome, CPF, matrícula
  page?: number;
  limit?: number;
}

export interface EmployeesRepository {
  create(employee: Employee): Promise<void>;
  save(employee: Employee): Promise<void>;
  findById(id: string): Promise<Employee | null>;
  findByCpf(cpf: string): Promise<Employee | null>;
  findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Employee | null>;
  findByUserId(userId: string): Promise<Employee | null>;
  findMany(params: FindManyEmployeesParams): Promise<Employee[]>;
  countMany(
    params: Omit<FindManyEmployeesParams, 'page' | 'limit'>,
  ): Promise<number>;
  delete(id: string): Promise<void>;
}
```

#### **Prisma Employees Repository** (`src/repositories/hr/prisma/prisma-employees-repository.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import { Employee } from '@/entities/hr/employee';
import {
  EmployeesRepository,
  FindManyEmployeesParams,
} from '../employees-repository';
import { EmployeeMapper } from '@/mappers/hr/employee/employee-mapper';

export class PrismaEmployeesRepository implements EmployeesRepository {
  constructor(private prisma: PrismaClient) {}

  async create(employee: Employee): Promise<void> {
    const data = EmployeeMapper.toPrisma(employee);
    await this.prisma.employee.create({ data });
  }

  async save(employee: Employee): Promise<void> {
    const data = EmployeeMapper.toPrisma(employee);
    await this.prisma.employee.update({
      where: { id: employee.id.toString() },
      data,
    });
  }

  async findById(id: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findByCpf(cpf: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { cpf, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { registrationNumber, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId, deletedAt: null },
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
    });
    if (!employee) return null;
    return EmployeeMapper.toDomain(employee);
  }

  async findMany(params: FindManyEmployeesParams): Promise<Employee[]> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.positionId) where.positionId = params.positionId;
    if (params.supervisorId) where.supervisorId = params.supervisorId;
    if (params.status) where.status = params.status;

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { cpf: { contains: params.search.replace(/\D/g, '') } },
        { registrationNumber: { contains: params.search } },
      ];
    }

    const employees = await this.prisma.employee.findMany({
      where,
      include: {
        department: true,
        position: true,
        supervisor: true,
      },
      orderBy: [{ hireDate: 'desc' }, { fullName: 'asc' }],
      skip,
      take: limit,
    });

    return employees.map(EmployeeMapper.toDomain);
  }

  async countMany(
    params: Omit<FindManyEmployeesParams, 'page' | 'limit'>,
  ): Promise<number> {
    const where: any = { deletedAt: null };

    if (params.departmentId) where.departmentId = params.departmentId;
    if (params.positionId) where.positionId = params.positionId;
    if (params.supervisorId) where.supervisorId = params.supervisorId;
    if (params.status) where.status = params.status;

    if (params.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { cpf: { contains: params.search.replace(/\D/g, '') } },
        { registrationNumber: { contains: params.search } },
      ];
    }

    return this.prisma.employee.count({ where });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
```

#### **In-Memory Employees Repository** (`src/repositories/hr/in-memory/in-memory-employees-repository.ts`)

```typescript
import { Employee } from '@/entities/hr/employee';
import {
  EmployeesRepository,
  FindManyEmployeesParams,
} from '../employees-repository';

export class InMemoryEmployeesRepository implements EmployeesRepository {
  public items: Employee[] = [];

  async create(employee: Employee): Promise<void> {
    this.items.push(employee);
  }

  async save(employee: Employee): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(employee.id));
    if (index >= 0) {
      this.items[index] = employee;
    }
  }

  async findById(id: string): Promise<Employee | null> {
    return (
      this.items.find((item) => item.id.toString() === id && !item.deletedAt) ??
      null
    );
  }

  async findByCpf(cpf: string): Promise<Employee | null> {
    return (
      this.items.find((item) => item.cpf.value === cpf && !item.deletedAt) ??
      null
    );
  }

  async findByRegistrationNumber(
    registrationNumber: string,
  ): Promise<Employee | null> {
    return (
      this.items.find(
        (item) =>
          item.registrationNumber === registrationNumber && !item.deletedAt,
      ) ?? null
    );
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    return (
      this.items.find((item) => item.userId === userId && !item.deletedAt) ??
      null
    );
  }

  async findMany(params: FindManyEmployeesParams): Promise<Employee[]> {
    let filtered = this.items.filter((item) => !item.deletedAt);

    if (params.departmentId) {
      filtered = filtered.filter(
        (item) => item.departmentId === params.departmentId,
      );
    }
    if (params.positionId) {
      filtered = filtered.filter(
        (item) => item.positionId === params.positionId,
      );
    }
    if (params.supervisorId) {
      filtered = filtered.filter(
        (item) => item.supervisorId === params.supervisorId,
      );
    }
    if (params.status) {
      filtered = filtered.filter((item) => item.status.value === params.status);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.fullName.toLowerCase().includes(search) ||
          item.cpf.value.includes(search) ||
          item.registrationNumber.includes(search),
      );
    }

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return filtered.slice(start, end);
  }

  async countMany(
    params: Omit<FindManyEmployeesParams, 'page' | 'limit'>,
  ): Promise<number> {
    let filtered = this.items.filter((item) => !item.deletedAt);

    if (params.departmentId) {
      filtered = filtered.filter(
        (item) => item.departmentId === params.departmentId,
      );
    }
    if (params.positionId) {
      filtered = filtered.filter(
        (item) => item.positionId === params.positionId,
      );
    }
    if (params.supervisorId) {
      filtered = filtered.filter(
        (item) => item.supervisorId === params.supervisorId,
      );
    }
    if (params.status) {
      filtered = filtered.filter((item) => item.status.value === params.status);
    }
    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.fullName.toLowerCase().includes(search) ||
          item.cpf.value.includes(search) ||
          item.registrationNumber.includes(search),
      );
    }

    return filtered.length;
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id.toString() === id);
    if (index >= 0) {
      this.items[index] = { ...this.items[index], deletedAt: new Date() };
    }
  }
}
```

---

## 🚀 Fase 2: Controle de Ponto (Semanas 3-4)

### 📋 Casos de Uso - Fase 2

#### **Time Control Module**

| Use Case                      | Descrição                  | Request                 | Response             |
| ----------------------------- | -------------------------- | ----------------------- | -------------------- |
| `ClockInUseCase`              | Registrar entrada          | `ClockInDTO`            | `TimeEntry`          |
| `ClockOutUseCase`             | Registrar saída            | `ClockOutDTO`           | `TimeEntry`          |
| `ListTimeEntriesUseCase`      | Listar registros de ponto  | `ListTimeEntriesParams` | `TimeEntry[] + meta` |
| `CalculateWorkedHoursUseCase` | Calcular horas trabalhadas | `period: DateRange`     | `WorkedHoursReport`  |
| `CreateWorkScheduleUseCase`   | Criar jornada de trabalho  | `CreateWorkScheduleDTO` | `WorkSchedule`       |
| `UpdateWorkScheduleUseCase`   | Atualizar jornada          | `UpdateWorkScheduleDTO` | `WorkSchedule`       |
| `RequestOvertimeUseCase`      | Solicitar hora extra       | `RequestOvertimeDTO`    | `Overtime`           |
| `ApproveOvertimeUseCase`      | Aprovar hora extra         | `ApproveOvertimeDTO`    | `Overtime`           |
| `ManageTimeBankUseCase`       | Gerenciar banco de horas   | `TimeBankOperationDTO`  | `TimeBank`           |

### 🎯 Critérios de Aceitação - Fase 2

- ✅ Registrar entrada/saída de funcionários
- ✅ Geolocalização opcional nos registros
- ✅ Validação de jornada de trabalho
- ✅ Cálculo automático de horas trabalhadas
- ✅ Solicitação e aprovação de horas extras
- ✅ Sistema de banco de horas
- ✅ Relatórios de ponto por período
- ✅ Validações de regras trabalhistas
- ✅ Auditoria completa de registros

---

## 🚀 Fase 3: Gestão de Ausências (Semanas 5-6)

### 📋 Casos de Uso - Fase 3

#### **Absences Module**

| Use Case                          | Descrição                    | Request                   | Response           |
| --------------------------------- | ---------------------------- | ------------------------- | ------------------ |
| `RequestVacationUseCase`          | Solicitar férias             | `RequestVacationDTO`      | `Absence`          |
| `RequestSickLeaveUseCase`         | Registrar atestado médico    | `RequestSickLeaveDTO`     | `Absence`          |
| `ApproveAbsenceUseCase`           | Aprovar ausência             | `ApproveAbsenceDTO`       | `Absence`          |
| `CalculateVacationBalanceUseCase` | Calcular saldo de férias     | `employeeId: string`      | `VacationBalance`  |
| `ListAbsencesUseCase`             | Listar ausências             | `ListAbsencesParams`      | `Absence[] + meta` |
| `CancelAbsenceUseCase`            | Cancelar ausência            | `absenceId: string`       | `Absence`          |
| `UpdateVacationPeriodUseCase`     | Atualizar período aquisitivo | `UpdateVacationPeriodDTO` | `VacationPeriod`   |

### 🎯 Critérios de Aceitação - Fase 3

- ✅ Solicitação de férias com cálculo automático de dias
- ✅ Registro de atestados médicos com CID
- ✅ Workflow de aprovação de ausências
- ✅ Cálculo de saldo de férias (30 dias/ano)
- ✅ Controle de períodos aquisitivos/concessivos
- ✅ Validação de limites legais (férias não podem exceder 30 dias)
- ✅ Relatórios de ausências por período
- ✅ Integração com módulo de Requests para workflow

---

## 🚀 Fase 4: Folha de Pagamento (Semanas 7-9)

### 📋 Casos de Uso - Fase 4

#### **Payroll Module**

| Use Case                      | Descrição                | Request                   | Response      |
| ----------------------------- | ------------------------ | ------------------------- | ------------- |
| `GeneratePayrollUseCase`      | Gerar folha de pagamento | `GeneratePayrollDTO`      | `Payroll`     |
| `CalculatePayrollItemUseCase` | Calcular item da folha   | `CalculatePayrollItemDTO` | `PayrollItem` |
| `ApplyBonusUseCase`           | Aplicar bonificação      | `ApplyBonusDTO`           | `Bonus`       |
| `ApplyDeductionUseCase`       | Aplicar desconto         | `ApplyDeductionDTO`       | `Deduction`   |
| `ClosePayrollUseCase`         | Fechar folha             | `payrollId: string`       | `Payroll`     |
| `GeneratePayslipUseCase`      | Gerar holerite           | `GeneratePayslipDTO`      | `Payslip`     |
| `ApprovePayrollUseCase`       | Aprovar folha            | `ApprovePayrollDTO`       | `Payroll`     |
| `RevertPayrollUseCase`        | Reverter folha           | `payrollId: string`       | `Payroll`     |

### 🎯 Critérios de Aceitação - Fase 4

- ✅ Geração automática de folha de pagamento mensal
- ✅ Cálculos trabalhistas (INSS, IRRF, FGTS)
- ✅ Aplicação de bonificações e descontos
- ✅ Controle de encargos patronais
- ✅ Geração de holerites em PDF
- ✅ Workflow de aprovação de folha
- ✅ Possibilidade de reversão de folha
- ✅ Relatórios de custos trabalhistas
- ✅ Validações de leis trabalhistas

---

## 🚀 Fase 5: Relatórios e Analytics (Semanas 10-11)

### 📋 Casos de Uso - Fase 5

#### **Reports Module**

| Use Case                           | Descrição                     | Request                   | Response            |
| ---------------------------------- | ----------------------------- | ------------------------- | ------------------- |
| `GenerateEmployeeReportUseCase`    | Relatório de funcionários     | `EmployeeReportParams`    | `EmployeeReport`    |
| `GeneratePayrollReportUseCase`     | Relatório de folha            | `PayrollReportParams`     | `PayrollReport`     |
| `GenerateAbsenceReportUseCase`     | Relatório de ausências        | `AbsenceReportParams`     | `AbsenceReport`     |
| `GenerateTimeControlReportUseCase` | Relatório de ponto            | `TimeControlReportParams` | `TimeControlReport` |
| `GenerateHeadcountReportUseCase`   | Relatório de quadro           | `HeadcountReportParams`   | `HeadcountReport`   |
| `GenerateCostCenterReportUseCase`  | Relatório por centro de custo | `CostCenterReportParams`  | `CostCenterReport`  |

### 🎯 Critérios de Aceitação - Fase 5

- ✅ Relatórios em múltiplos formatos (JSON, CSV, PDF)
- ✅ Dashboards com métricas de RH
- ✅ Análises de turnover e absenteísmo
- ✅ Relatórios de custos trabalhistas
- ✅ Indicadores de produtividade
- ✅ Exportação para sistemas externos
- ✅ Agendamento de relatórios
- ✅ Cache de relatórios pesados

---

## 📊 Roadmap Completo

| Fase | Módulo              | Semanas | Status          |
| ---- | ------------------- | ------- | --------------- |
| 1    | Gestão Básica       | 1-2     | ✅ Implementada |
| 2    | Controle de Ponto   | 3-4     | ✅ Implementada |
| 3    | Gestão de Ausências | 5-6     | ✅ Implementada |
| 4    | Folha de Pagamento  | 7-9     | 📋 Planejada    |
| 5    | Relatórios          | 10-11   | 📋 Planejada    |

## ✅ O que foi implementado

### Fase 1: Gestão Básica de Funcionários ✅
- ✅ Entidades: Employee, Department, Position
- ✅ Value Objects: CPF, PIS, EmployeeStatus, ContractType, WorkRegime, etc.
- ✅ Repositories: Prisma e In-Memory para todas as entidades
- ✅ Use Cases: CRUD completo para funcionários, departamentos e cargos
- ✅ Controllers: Endpoints REST completos
- ✅ Schemas Zod: Validações de entrada e saída
- ✅ Mappers: Conversores Domain ↔ Persistence
- ✅ Testes: Unitários e E2E com cobertura >80%

### Fase 2: Controle de Ponto ✅
- ✅ Entidades: TimeEntry, WorkSchedule, Overtime, TimeBank
- ✅ Controle de jornada de trabalho
- ✅ Registro de entrada/saída com geolocalização opcional
- ✅ Sistema de banco de horas
- ✅ Solicitação e aprovação de horas extras
- ✅ Validações de regras trabalhistas
- ✅ Testes completos

### Fase 3: Gestão de Ausências ✅
- ✅ Entidades: Absence, VacationPeriod
- ✅ Solicitação de férias com cálculo automático
- ✅ Registro de atestados médicos
- ✅ Workflow de aprovação
- ✅ Controle de períodos aquisitivos/concessivos
- ✅ Cálculo de saldo de férias
- ✅ Testes completos

## 📋 Próximos Passos

### Fase 4: Folha de Pagamento (Semanas 7-9)
- [ ] Implementar entidades: Payroll, PayrollItem, Bonus, Deduction, Benefit, EmployeeBenefit
- [ ] Sistema de cálculos trabalhistas (INSS, IRRF, FGTS)
- [ ] Geração automática de folha mensal
- [ ] Aplicação de bonificações e descontos
- [ ] Geração de holerites em PDF
- [ ] Workflow de aprovação de folha
- [ ] Testes unitários e E2E

### Fase 5: Relatórios e Analytics (Semanas 10-11)
- [ ] Relatórios de funcionários, folha, ausências, ponto
- [ ] Dashboards com métricas de RH
- [ ] Análises de turnover e absenteísmo
- [ ] Exportação em múltiplos formatos (JSON, CSV, PDF)
- [ ] Agendamento de relatórios
- [ ] Cache para relatórios pesados

### Melhorias Futuras
- [ ] Integração com sistemas externos (folha de pagamento)
- [ ] Notificações automáticas por email
- [ ] Mobile app para registro de ponto
- [ ] BI avançado com dashboards interativos
- [ ] Integração com sistemas de gestão fiscal

- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Validação**: Zod schemas
- **Documentação**: Swagger/OpenAPI
- **Testes**: Vitest + Supertest
- **Relatórios**: Puppeteer (PDF) + CSV generation
- **Cache**: Redis (opcional para relatórios)
- **Email**: Integração com módulo de email existente
- **Notificações**: Integração com módulo de notifications

### 📈 Métricas de Sucesso

- **Coverage de Testes**: > 80%
- **Performance**: Respostas < 500ms para operações CRUD
- **Uptime**: 99.9% disponibilidade
- **Usuários Ativos**: Suporte a 1000+ funcionários
- **Compliance**: 100% aderente à CLT e legislações trabalhistas

---

## 🎯 Conclusão

Este plano detalhado fornece uma implementação completa e estruturada do módulo de RH, seguindo os princípios de DDD, Clean Architecture e SOLID já estabelecidos no projeto. Cada fase é independente e pode ser implementada incrementalmente, permitindo entregas contínuas e feedback precoce.

A implementação seguirá rigorosamente os padrões de arquitetura do projeto, garantindo consistência, testabilidade e manutenibilidade do código.

### 📋 Resumo das Fases

1. **Fase 1**: Gestão básica de funcionários, departamentos e cargos
2. **Fase 2**: Controle de ponto e jornada de trabalho
3. **Fase 3**: Gestão de ausências e férias
4. **Fase 4**: Folha de pagamento e cálculos trabalhistas
5. **Fase 5**: Relatórios e analytics de RH

### 🎯 Benefícios Esperados

- **Conformidade Legal**: Sistema aderente à CLT e legislações trabalhistas
- **Eficiência Operacional**: Automação de processos manuais de RH
- **Redução de Erros**: Validações automáticas e cálculos precisos
- **Melhoria na Gestão**: Relatórios e indicadores para tomada de decisão
- **Escalabilidade**: Suporte a crescimento da empresa
- **Integração**: Vinculação com outros módulos do sistema

---

_Documento criado em: 26 de novembro de 2025_
_Última atualização: 2 de dezembro de 2025_
