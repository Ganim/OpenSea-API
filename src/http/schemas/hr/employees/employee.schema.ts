/**
 * HR Employee Schemas
 * Schemas para validação de funcionários
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';
import {
  contractTypeSchema,
  employeeStatusSchema,
  workRegimeSchema,
} from './employee-enums.schema';
import {
  hrCpfSchema,
  hrPhoneSchema,
  hrPisSchema,
  hrZipCodeSchema,
} from './employee-common.schema';

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
  pcd: z.boolean().optional().default(false),
  maritalStatus: z.string().max(32).optional(),
  nationality: z.string().max(64).optional(),
  birthPlace: z.string().max(128).optional(),
  emergencyContactInfo: z
    .object({
      name: z.string().max(128).optional(),
      phone: hrPhoneSchema.optional(),
      relationship: z.string().max(64).optional(),
    })
    .optional(),
  healthConditions: z
    .array(
      z.object({
        description: z.string().max(256),
        requiresAttention: z.boolean(),
      }),
    )
    .optional(),

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
  companyId: idSchema.optional(),

  // Foto
  photoUrl: z.string().url().optional(),

  // Metadados
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema para criação de funcionário com usuário
 * Combina dados de usuário e funcionário em uma única requisição
 */
export const createEmployeeWithUserSchema = createEmployeeSchema
  .omit({
    userId: true, // Remove userId pois será criado automaticamente
  })
  .extend({
    // Dados do usuário
    userEmail: z.string().email(),
    userPassword: z.string().min(8).max(128),
    username: z.string().min(3).max(32).optional(),
  });

/**
 * Schema para resposta de criação de funcionário com usuário
 */
export const createEmployeeWithUserResponseSchema = z.object({
  employee: z.any(), // employeeResponseSchema
  user: z.object({
    id: idSchema,
    email: z.string().email(),
    username: z.string(),
    lastLoginAt: dateSchema.nullable(),
    profile: z
      .object({
        name: z.string(),
        surname: z.string(),
        birthday: dateSchema.optional().nullable(),
        location: z.string().optional().nullable(),
        bio: z.string().optional().nullable(),
        avatarUrl: z.string().optional().nullable(),
      })
      .nullable(),
    deletedAt: dateSchema.optional().nullable(),
  }),
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
  companyId: idSchema.optional(),
  search: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional().default(false),
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
  pcd: z.boolean(),
  maritalStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  emergencyContactInfo: z
    .object({
      name: z.string().max(128).optional(),
      phone: z.string().optional(),
      relationship: z.string().max(64).optional(),
    })
    .optional()
    .nullable(),
  healthConditions: z
    .array(
      z.object({
        description: z.string(),
        requiresAttention: z.boolean(),
      }),
    )
    .optional()
    .nullable(),
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
  companyId: idSchema.optional().nullable(),
  hireDate: dateSchema,
  terminationDate: dateSchema.optional().nullable(),
  status: z.string(),
  baseSalary: z.number(),
  contractType: z.string(),
  workRegime: z.string(),
  weeklyHours: z.number(),
  photoUrl: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  pendingIssues: z.array(z.string()),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

/**
 * Schema para checar CPF
 */
export const checkCpfSchema = z.object({
  cpf: hrCpfSchema,
  includeDeleted: z.coerce.boolean().optional().default(false),
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

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateEmployeeWithUserInput = z.infer<
  typeof createEmployeeWithUserSchema
>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type TerminateEmployeeInput = z.infer<typeof terminateEmployeeSchema>;
export type LinkUserToEmployeeInput = z.infer<typeof linkUserToEmployeeSchema>;
export type TransferEmployeeInput = z.infer<typeof transferEmployeeSchema>;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;
export type EmployeeResponse = z.infer<typeof employeeResponseSchema>;
