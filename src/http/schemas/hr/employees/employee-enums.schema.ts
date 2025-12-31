/**
 * HR Employee Enums
 * Enums reutilizáveis para validação de funcionários
 */

import { z } from 'zod';

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

export type EmployeeStatus = z.infer<typeof employeeStatusSchema>;
export type ContractType = z.infer<typeof contractTypeSchema>;
export type WorkRegime = z.infer<typeof workRegimeSchema>;
