/**
 * HR Zod Schemas
 * Schemas reutilizáveis para validação de recursos humanos
 */

import { z } from 'zod';
import { dateSchema, idSchema } from './common.schema';

// ===============================================
// ENUMS
// ===============================================

/**
 * Status do funcionário
 */
export const employeeStatusSchema = z.enum([
  'ACTIVE',
  'ON_LEAVE',
  'VACATION',
  'SUSPENDED',
  'TERMINATED',
]);

/**
 * Tipo de contrato
 */
export const contractTypeSchema = z.enum([
  'CLT',
  'PJ',
  'INTERN',
  'TEMPORARY',
  'APPRENTICE',
]);

/**
 * Regime de trabalho
 */
export const workRegimeSchema = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'HOURLY',
  'SHIFT',
  'FLEXIBLE',
]);

// ===============================================
// COMMON SCHEMAS
// ===============================================

/**
 * Schema para CPF (HR - mais permissivo para aceitar só números)
 */
export const hrCpfSchema = z
  .string()
  .min(11)
  .max(14)
  .transform((val) => val.replace(/\D/g, ''));

/**
 * Schema para PIS
 */
export const hrPisSchema = z
  .string()
  .min(11)
  .max(14)
  .transform((val) => val.replace(/\D/g, ''))
  .optional();

/**
 * Schema para telefone (HR)
 */
export const hrPhoneSchema = z.string().max(20).optional();

/**
 * Schema para CEP (HR)
 */
export const hrZipCodeSchema = z.string().max(10).optional();

// ===============================================
// EMPLOYEE SCHEMAS
// ===============================================

/**
 * Schema para criação de funcionário
 */
export const createEmployeeSchema = z.object({
  // Dados obrigatórios
  registrationNumber: z.string().min(1).max(32),
  fullName: z.string().min(2).max(256),
  cpf: hrCpfSchema,
  hireDate: z.coerce.date(),
  baseSalary: z.number().positive(),
  contractType: contractTypeSchema,
  workRegime: workRegimeSchema,
  weeklyHours: z.number().positive().max(44),

  // Vínculo com usuário
  userId: idSchema.optional(),

  // Dados pessoais opcionais
  socialName: z.string().max(256).optional(),
  birthDate: z.coerce.date().optional(),
  gender: z.string().max(32).optional(),
  maritalStatus: z.string().max(32).optional(),
  nationality: z.string().max(64).optional(),
  birthPlace: z.string().max(128).optional(),

  // Documentos
  rg: z.string().max(20).optional(),
  rgIssuer: z.string().max(32).optional(),
  rgIssueDate: z.coerce.date().optional(),
  pis: hrPisSchema,
  ctpsNumber: z.string().max(32).optional(),
  ctpsSeries: z.string().max(16).optional(),
  ctpsState: z.string().max(2).optional(),
  voterTitle: z.string().max(16).optional(),
  militaryDoc: z.string().max(32).optional(),

  // Contato
  email: z.string().email().optional(),
  personalEmail: z.string().email().optional(),
  phone: hrPhoneSchema,
  mobilePhone: hrPhoneSchema,
  emergencyContact: z.string().max(128).optional(),
  emergencyPhone: hrPhoneSchema,

  // Endereço
  address: z.string().max(256).optional(),
  addressNumber: z.string().max(16).optional(),
  complement: z.string().max(128).optional(),
  neighborhood: z.string().max(128).optional(),
  city: z.string().max(128).optional(),
  state: z.string().max(2).optional(),
  zipCode: hrZipCodeSchema,
  country: z.string().max(64).default('Brasil'),

  // Dados bancários
  bankCode: z.string().max(8).optional(),
  bankName: z.string().max(128).optional(),
  bankAgency: z.string().max(16).optional(),
  bankAccount: z.string().max(32).optional(),
  bankAccountType: z.string().max(32).optional(),
  pixKey: z.string().max(128).optional(),

  // Vínculo organizacional
  departmentId: idSchema.optional(),
  positionId: idSchema.optional(),
  supervisorId: idSchema.optional(),

  // Foto
  photoUrl: z.string().url().optional(),

  // Metadados
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema para atualização de funcionário
 */
export const updateEmployeeSchema = createEmployeeSchema
  .omit({
    registrationNumber: true,
    cpf: true,
    hireDate: true,
  })
  .partial()
  .extend({
    registrationNumber: z.string().min(1).max(32).optional(),
    cpf: hrCpfSchema.optional(),
    hireDate: z.coerce.date().optional(),
  });

/**
 * Schema para desligamento de funcionário
 */
export const terminateEmployeeSchema = z.object({
  terminationDate: z.coerce.date(),
  reason: z.string().max(500).optional(),
});

/**
 * Schema para vincular usuário ao funcionário
 */
export const linkUserToEmployeeSchema = z.object({
  userId: idSchema,
});

/**
 * Schema para transferência de funcionário
 */
export const transferEmployeeSchema = z.object({
  newDepartmentId: idSchema.optional().nullable(),
  newPositionId: idSchema.optional().nullable(),
  newSupervisorId: idSchema.optional().nullable(),
  newBaseSalary: z.number().positive().optional(),
  effectiveDate: z.coerce.date().optional(),
  reason: z.string().max(500).optional(),
});

/**
 * Schema para filtros de listagem de funcionários
 */
export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  status: employeeStatusSchema.optional(),
  departmentId: idSchema.optional(),
  positionId: idSchema.optional(),
  supervisorId: idSchema.optional(),
  search: z.string().optional(),
});

/**
 * Schema para resposta de funcionário
 */
export const employeeResponseSchema = z.object({
  id: idSchema,
  registrationNumber: z.string(),
  userId: idSchema.optional().nullable(),
  fullName: z.string(),
  socialName: z.string().optional().nullable(),
  birthDate: dateSchema.optional().nullable(),
  gender: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  cpf: z.string(),
  rg: z.string().optional().nullable(),
  rgIssuer: z.string().optional().nullable(),
  rgIssueDate: dateSchema.optional().nullable(),
  pis: z.string().optional().nullable(),
  ctpsNumber: z.string().optional().nullable(),
  ctpsSeries: z.string().optional().nullable(),
  ctpsState: z.string().optional().nullable(),
  voterTitle: z.string().optional().nullable(),
  militaryDoc: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  personalEmail: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobilePhone: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string(),
  bankCode: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAgency: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  bankAccountType: z.string().optional().nullable(),
  pixKey: z.string().optional().nullable(),
  departmentId: idSchema.optional().nullable(),
  positionId: idSchema.optional().nullable(),
  supervisorId: idSchema.optional().nullable(),
  hireDate: dateSchema,
  terminationDate: dateSchema.optional().nullable(),
  status: z.string(),
  baseSalary: z.number(),
  contractType: z.string(),
  workRegime: z.string(),
  weeklyHours: z.number(),
  photoUrl: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

/**
 * Schema para paginação de resposta
 */
export const paginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});

// ===============================================
// DEPARTMENT SCHEMAS
// ===============================================

/**
 * Schema para criação de departamento
 */
export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(128),
  code: z.string().min(1).max(32),
  description: z.string().max(1000).optional(),
  parentId: idSchema.optional().nullable(),
  managerId: idSchema.optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema para atualização de departamento
 */
export const updateDepartmentSchema = createDepartmentSchema.partial();

/**
 * Schema para filtros de listagem de departamentos
 */
export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  parentId: idSchema.optional(),
});

/**
 * Schema para resposta de departamento
 */
export const departmentResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string(),
  description: z.string().optional().nullable(),
  parentId: idSchema.optional().nullable(),
  managerId: idSchema.optional().nullable(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

// ===============================================
// POSITION SCHEMAS
// ===============================================

/**
 * Schema para criação de cargo
 */
export const createPositionSchema = z.object({
  name: z.string().min(2).max(128),
  code: z.string().min(1).max(32),
  description: z.string().max(1000).optional(),
  departmentId: idSchema.optional().nullable(),
  level: z.number().int().positive().optional().default(1),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema para atualização de cargo
 */
export const updatePositionSchema = createPositionSchema.partial();

/**
 * Schema para filtros de listagem de cargos
 */
export const listPositionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  departmentId: idSchema.optional(),
  level: z.coerce.number().int().positive().optional(),
});

/**
 * Schema para resposta de cargo
 */
export const positionResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string(),
  description: z.string().optional().nullable(),
  departmentId: idSchema.optional().nullable(),
  level: z.number(),
  minSalary: z.number().optional().nullable(),
  maxSalary: z.number().optional().nullable(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

// ===============================================
// TIME CONTROL SCHEMAS
// ===============================================

/**
 * Tipo de registro de ponto
 */
export const timeEntryTypeSchema = z.enum([
  'CLOCK_IN',
  'CLOCK_OUT',
  'BREAK_START',
  'BREAK_END',
  'OVERTIME_START',
  'OVERTIME_END',
]);

/**
 * Schema para registro de ponto (clock in/out)
 */
export const clockInOutSchema = z.object({
  employeeId: idSchema,
  timestamp: z.coerce.date().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ipAddress: z.string().max(64).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Schema para filtros de listagem de registros de ponto
 */
export const listTimeEntriesQuerySchema = z.object({
  employeeId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  entryType: timeEntryTypeSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(50),
});

/**
 * Schema para cálculo de horas trabalhadas
 */
export const calculateWorkedHoursSchema = z.object({
  employeeId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

/**
 * Schema para resposta de registro de ponto
 */
export const timeEntryResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  entryType: z.string(),
  timestamp: dateSchema,
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: dateSchema,
});

/**
 * Schema para resposta de horas diárias
 */
export const dailyHoursResponseSchema = z.object({
  date: dateSchema,
  workedHours: z.number(),
  breakHours: z.number(),
  overtimeHours: z.number(),
  totalHours: z.number(),
});

/**
 * Schema para resposta de cálculo de horas
 */
export const workedHoursResponseSchema = z.object({
  employeeId: idSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  dailyBreakdown: z.array(dailyHoursResponseSchema),
  totalWorkedHours: z.number(),
  totalBreakHours: z.number(),
  totalOvertimeHours: z.number(),
  totalNetHours: z.number(),
});

// ===============================================
// WORK SCHEDULE SCHEMAS
// ===============================================

/**
 * Schema para formato de hora (HH:MM)
 */
export const timeFormatSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM');

/**
 * Schema para criação de escala de trabalho
 */
export const createWorkScheduleSchema = z.object({
  name: z.string().min(2).max(128),
  description: z.string().max(500).optional(),
  mondayStart: timeFormatSchema.optional(),
  mondayEnd: timeFormatSchema.optional(),
  tuesdayStart: timeFormatSchema.optional(),
  tuesdayEnd: timeFormatSchema.optional(),
  wednesdayStart: timeFormatSchema.optional(),
  wednesdayEnd: timeFormatSchema.optional(),
  thursdayStart: timeFormatSchema.optional(),
  thursdayEnd: timeFormatSchema.optional(),
  fridayStart: timeFormatSchema.optional(),
  fridayEnd: timeFormatSchema.optional(),
  saturdayStart: timeFormatSchema.optional(),
  saturdayEnd: timeFormatSchema.optional(),
  sundayStart: timeFormatSchema.optional(),
  sundayEnd: timeFormatSchema.optional(),
  breakDuration: z.number().int().min(0).max(480),
});

/**
 * Schema para atualização de escala de trabalho
 */
export const updateWorkScheduleSchema = createWorkScheduleSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

/**
 * Schema para filtros de listagem de escalas
 */
export const listWorkSchedulesQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional().default(false),
});

/**
 * Schema para resposta de escala de trabalho
 */
export const workScheduleResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string().optional().nullable(),
  mondayStart: z.string().optional().nullable(),
  mondayEnd: z.string().optional().nullable(),
  tuesdayStart: z.string().optional().nullable(),
  tuesdayEnd: z.string().optional().nullable(),
  wednesdayStart: z.string().optional().nullable(),
  wednesdayEnd: z.string().optional().nullable(),
  thursdayStart: z.string().optional().nullable(),
  thursdayEnd: z.string().optional().nullable(),
  fridayStart: z.string().optional().nullable(),
  fridayEnd: z.string().optional().nullable(),
  saturdayStart: z.string().optional().nullable(),
  saturdayEnd: z.string().optional().nullable(),
  sundayStart: z.string().optional().nullable(),
  sundayEnd: z.string().optional().nullable(),
  breakDuration: z.number(),
  isActive: z.boolean(),
  weeklyHours: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
// OVERTIME SCHEMAS
// ===============================================

/**
 * Schema para solicitação de hora extra
 */
export const requestOvertimeSchema = z.object({
  employeeId: idSchema,
  date: z.coerce.date(),
  hours: z.number().positive().max(12),
  reason: z.string().min(10).max(500),
});

/**
 * Schema para aprovação de hora extra
 */
export const approveOvertimeSchema = z.object({
  addToTimeBank: z.boolean().optional().default(false),
});

/**
 * Schema para filtros de listagem de horas extras
 */
export const listOvertimeQuerySchema = z.object({
  employeeId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  approved: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de hora extra
 */
export const overtimeResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  date: dateSchema,
  hours: z.number(),
  reason: z.string(),
  approved: z.boolean(),
  approvedBy: idSchema.optional().nullable(),
  approvedAt: dateSchema.optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
// TIME BANK SCHEMAS
// ===============================================

/**
 * Schema para consulta de banco de horas
 */
export const getTimeBankQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para crédito/débito no banco de horas
 */
export const creditDebitTimeBankSchema = z.object({
  employeeId: idSchema,
  hours: z.number().positive(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para ajuste do banco de horas
 */
export const adjustTimeBankSchema = z.object({
  employeeId: idSchema,
  newBalance: z.number(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para filtros de listagem de banco de horas
 */
export const listTimeBanksQuerySchema = z.object({
  employeeId: idSchema.optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

/**
 * Schema para resposta de banco de horas
 */
export const timeBankResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  balance: z.number(),
  year: z.number(),
  hasPositiveBalance: z.boolean(),
  hasNegativeBalance: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
// ABSENCE SCHEMAS
// ===============================================

/**
 * Tipos de ausência
 */
export const absenceTypeSchema = z.enum([
  'VACATION',
  'SICK_LEAVE',
  'PERSONAL_LEAVE',
  'MATERNITY_LEAVE',
  'PATERNITY_LEAVE',
  'BEREAVEMENT_LEAVE',
  'WEDDING_LEAVE',
  'MEDICAL_APPOINTMENT',
  'JURY_DUTY',
  'UNPAID_LEAVE',
  'OTHER',
]);

/**
 * Status de ausência
 */
export const absenceStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'IN_PROGRESS',
  'COMPLETED',
]);

/**
 * Schema para solicitação de férias
 */
export const requestVacationSchema = z.object({
  employeeId: idSchema,
  vacationPeriodId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().max(500).optional(),
});

/**
 * Schema para solicitação de atestado médico
 */
export const requestSickLeaveSchema = z.object({
  employeeId: idSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  cid: z.string().min(1).max(10),
  documentUrl: z.string().url().optional(),
  reason: z.string().min(10).max(500),
});

/**
 * Schema para aprovação de ausência
 */
export const approveAbsenceSchema = z.object({});

/**
 * Schema para rejeição de ausência
 */
export const rejectAbsenceSchema = z.object({
  reason: z.string().min(10).max(500),
});

/**
 * Schema para filtros de listagem de ausências
 */
export const listAbsencesQuerySchema = z.object({
  employeeId: idSchema.optional(),
  type: absenceTypeSchema.optional(),
  status: absenceStatusSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de ausência
 */
export const absenceResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  type: z.string(),
  status: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  totalDays: z.number(),
  reason: z.string().optional().nullable(),
  documentUrl: z.string().optional().nullable(),
  cid: z.string().optional().nullable(),
  isPaid: z.boolean(),
  requestedBy: idSchema.optional().nullable(),
  approvedBy: idSchema.optional().nullable(),
  approvedAt: dateSchema.optional().nullable(),
  rejectionReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
// VACATION PERIOD SCHEMAS
// ===============================================

/**
 * Status de período de férias
 */
export const vacationStatusSchema = z.enum([
  'PENDING',
  'AVAILABLE',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'SOLD',
]);

/**
 * Schema para criação de período de férias
 */
export const createVacationPeriodSchema = z.object({
  employeeId: idSchema,
  acquisitionStart: z.coerce.date(),
  acquisitionEnd: z.coerce.date(),
  concessionStart: z.coerce.date(),
  concessionEnd: z.coerce.date(),
  totalDays: z.number().int().positive().default(30),
  notes: z.string().max(500).optional(),
});

/**
 * Schema para agendamento de férias
 */
export const scheduleVacationSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  days: z.number().int().positive().min(5).max(30),
});

/**
 * Schema para venda de férias (abono pecuniário)
 */
export const sellVacationDaysSchema = z.object({
  daysToSell: z.number().int().positive().max(10),
});

/**
 * Schema para conclusão de férias
 */
export const completeVacationSchema = z.object({
  daysUsed: z.number().int().positive(),
});

/**
 * Schema para filtros de listagem de períodos de férias
 */
export const listVacationPeriodsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  status: vacationStatusSchema.optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de período de férias
 */
export const vacationPeriodResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  acquisitionStart: dateSchema,
  acquisitionEnd: dateSchema,
  concessionStart: dateSchema,
  concessionEnd: dateSchema,
  totalDays: z.number(),
  usedDays: z.number(),
  soldDays: z.number(),
  remainingDays: z.number(),
  status: z.string(),
  scheduledStart: dateSchema.optional().nullable(),
  scheduledEnd: dateSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para resposta de saldo de férias
 */
export const vacationBalanceResponseSchema = z.object({
  employeeId: idSchema,
  employeeName: z.string(),
  totalAvailableDays: z.number(),
  totalUsedDays: z.number(),
  totalSoldDays: z.number(),
  periods: z.array(
    z.object({
      acquisitionPeriod: z.string(),
      concessionDeadline: dateSchema,
      totalDays: z.number(),
      usedDays: z.number(),
      soldDays: z.number(),
      remainingDays: z.number(),
      status: z.string(),
      isExpired: z.boolean(),
      daysUntilExpiration: z.number(),
    }),
  ),
});

// ===============================================
// PAYROLL SCHEMAS
// ===============================================

/**
 * Status da folha de pagamento
 */
export const payrollStatusSchema = z.enum([
  'DRAFT',
  'PROCESSING',
  'CALCULATED',
  'APPROVED',
  'PAID',
  'CANCELLED',
]);

/**
 * Tipo de item da folha
 */
export const payrollItemTypeSchema = z.enum([
  'BASE_SALARY',
  'OVERTIME',
  'NIGHT_SHIFT',
  'HAZARD_PAY',
  'UNHEALTHY_PAY',
  'BONUS',
  'COMMISSION',
  'VACATION_PAY',
  'THIRTEENTH_SALARY',
  'PROFIT_SHARING',
  'TRANSPORTATION_ALLOWANCE',
  'MEAL_ALLOWANCE',
  'HEALTH_PLAN',
  'DENTAL_PLAN',
  'INSS',
  'IRRF',
  'FGTS',
  'UNION_CONTRIBUTION',
  'ADVANCE_DEDUCTION',
  'ABSENCE_DEDUCTION',
  'OTHER_EARNING',
  'OTHER_DEDUCTION',
]);

/**
 * Schema para criação de folha de pagamento
 */
export const createPayrollSchema = z.object({
  referenceMonth: z.coerce.number().int().min(1).max(12),
  referenceYear: z.coerce.number().int().min(2000).max(2100),
});

/**
 * Schema para cálculo de folha de pagamento
 */
export const calculatePayrollSchema = z.object({});

/**
 * Schema para aprovação de folha de pagamento
 */
export const approvePayrollSchema = z.object({});

/**
 * Schema para pagamento de folha de pagamento
 */
export const payPayrollSchema = z.object({});

/**
 * Schema para filtros de listagem de folhas de pagamento
 */
export const listPayrollsQuerySchema = z.object({
  referenceMonth: z.coerce.number().int().min(1).max(12).optional(),
  referenceYear: z.coerce.number().int().min(2000).max(2100).optional(),
  status: payrollStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de folha de pagamento
 */
export const payrollResponseSchema = z.object({
  id: idSchema,
  referenceMonth: z.number(),
  referenceYear: z.number(),
  status: z.string(),
  totalGross: z.number(),
  totalDeductions: z.number(),
  totalNet: z.number(),
  processedBy: idSchema.optional().nullable(),
  processedAt: dateSchema.optional().nullable(),
  approvedBy: idSchema.optional().nullable(),
  approvedAt: dateSchema.optional().nullable(),
  paidBy: idSchema.optional().nullable(),
  paidAt: dateSchema.optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para resposta de item da folha de pagamento
 */
export const payrollItemResponseSchema = z.object({
  id: idSchema,
  payrollId: idSchema,
  employeeId: idSchema,
  type: z.string(),
  description: z.string(),
  amount: z.number(),
  isDeduction: z.boolean(),
  referenceId: idSchema.optional().nullable(),
  referenceType: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
// BONUS SCHEMAS
// ===============================================

/**
 * Schema para criação de bônus
 */
export const createBonusSchema = z.object({
  employeeId: idSchema,
  name: z.string().min(1).max(128),
  amount: z.number().positive(),
  reason: z.string().min(10).max(1000),
  date: z.coerce.date(),
});

/**
 * Schema para filtros de listagem de bônus
 */
export const listBonusesQuerySchema = z.object({
  employeeId: idSchema.optional(),
  isPaid: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de bônus
 */
export const bonusResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  name: z.string(),
  amount: z.number(),
  reason: z.string(),
  date: dateSchema,
  isPaid: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
// DEDUCTION SCHEMAS
// ===============================================

/**
 * Schema para criação de dedução
 */
export const createDeductionSchema = z.object({
  employeeId: idSchema,
  name: z.string().min(1).max(128),
  amount: z.number().positive(),
  reason: z.string().min(10).max(1000),
  date: z.coerce.date(),
  isRecurring: z.boolean().optional().default(false),
  installments: z.number().int().positive().optional(),
});

/**
 * Schema para filtros de listagem de deduções
 */
export const listDeductionsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  isApplied: z.coerce.boolean().optional(),
  isRecurring: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de dedução
 */
export const deductionResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  name: z.string(),
  amount: z.number(),
  reason: z.string(),
  date: dateSchema,
  isRecurring: z.boolean(),
  installments: z.number().optional().nullable(),
  currentInstallment: z.number().nullable(),
  isApplied: z.boolean(),
  appliedAt: dateSchema.optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
// ===============================================
// ENTERPRISE SCHEMAS
// ===============================================

/**
 * Schema para criação de empresa
 */
export const createEnterpriseSchema = z.object({
  legalName: z.string().min(2).max(256),
  cnpj: z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
  taxRegime: z.string().max(128).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(256).optional(),
  addressNumber: z.string().max(16).optional(),
  complement: z.string().max(128).optional(),
  neighborhood: z.string().max(128).optional(),
  city: z.string().max(128).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().max(10).optional(),
  country: z.string().max(64).optional(),
  logoUrl: z.string().url().max(512).optional(),
});

/**
 * Schema para atualização de empresa
 */
export const updateEnterpriseSchema = createEnterpriseSchema.partial().omit({
  cnpj: true,
});

/**
 * Schema para filtros de listagem de empresas
 */
export const listEnterprisesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
});

/**
 * Schema para resposta de empresa
 */
export const enterpriseResponseSchema = z.object({
  id: idSchema,
  legalName: z.string(),
  cnpj: z.string(),
  taxRegime: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressNumber: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  country: z.string(),
  logoUrl: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

/**
 * Schema para verificar CNPJ
 */
export const checkCnpjSchema = z.object({
  cnpj: z.string().regex(/^\d{14}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
});