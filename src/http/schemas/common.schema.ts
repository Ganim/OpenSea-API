/**
 * Common Zod Schemas
 * Schemas reutilizáveis para validação em toda a aplicação
 */

import { z } from 'zod';

/**
 * Schema para ID (UUID)
 */
export const idSchema = z.string().uuid({
  message: 'ID must be a valid UUID',
});

/**
 * Schema para paginação
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Page number (starts at 1)'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page (max 100)'),
});

/**
 * Schema para resposta paginada
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      pages: z.number().int().nonnegative(),
    }),
  });

/**
 * Schema para email
 */
export const emailSchema = z
  .string()
  .email({
    message: 'Invalid email format',
  })
  .toLowerCase()
  .trim();

/**
 * Schema para senha forte
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

/**
 * Schema para username
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(30, 'Username must be at most 30 characters long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores and hyphens',
  )
  .trim();

/**
 * Schema para nome
 */
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name must be at most 100 characters long')
  .trim();

/**
 * Schema para URL
 */
export const urlSchema = z.string().url({
  message: 'Invalid URL format',
});

/**
 * Schema para data (ISO 8601)
 */
export const dateSchema = z.coerce.date();

/**
 * Schema para boolean
 */
export const booleanSchema = z.coerce.boolean();

/**
 * Schema para número positivo
 */
export const positiveNumberSchema = z.coerce.number().positive();

/**
 * Schema para número não-negativo (incluindo zero)
 */
export const nonNegativeNumberSchema = z.coerce.number().nonnegative();

/**
 * Schema para preço/valor monetário
 */
export const priceSchema = z.coerce
  .number()
  .nonnegative()
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

/**
 * Schema para telefone (formato brasileiro)
 */
export const phoneSchema = z
  .string()
  .regex(
    /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/,
    'Invalid phone format. Use: (99) 99999-9999',
  )
  .optional();

/**
 * Schema para CEP (formato brasileiro)
 */
export const cepSchema = z
  .string()
  .regex(/^[0-9]{5}-?[0-9]{3}$/, 'Invalid CEP format. Use: 99999-999')
  .optional();

/**
 * Schema para CPF (formato brasileiro)
 */
export const cpfSchema = z
  .string()
  .regex(
    /^[0-9]{3}\.?[0-9]{3}\.?[0-9]{3}-?[0-9]{2}$/,
    'Invalid CPF format. Use: 999.999.999-99',
  )
  .optional();

/**
 * Schema para CNPJ (formato brasileiro)
 */
export const cnpjSchema = z
  .string()
  .regex(
    /^[0-9]{2}\.?[0-9]{3}\.?[0-9]{3}\/?[0-9]{4}-?[0-9]{2}$/,
    'Invalid CNPJ format. Use: 99.999.999/9999-99',
  )
  .optional();
