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
