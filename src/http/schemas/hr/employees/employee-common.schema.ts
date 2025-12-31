/**
 * HR Employee Common Schemas
 * Schemas comuns reutilizáveis para funcionários
 */

import { z } from 'zod';

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
