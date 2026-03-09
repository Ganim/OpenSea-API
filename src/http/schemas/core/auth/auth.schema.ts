/**
 * Auth Zod Schemas
 * Schemas reutilizáveis para validação de autenticação
 */

import { z } from 'zod';
import {
  emailSchema,
  idSchema,
  strongPasswordSchema,
} from '../../common.schema';
import { userResponseSchema } from '../users/user.schema';

/**
 * Schema para login com senha
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema para registro
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: strongPasswordSchema,
});

/**
 * Schema para reset de senha
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: strongPasswordSchema,
});

/**
 * Schema para solicitação de reset de senha
 */
export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

/**
 * Schema para tenant resumido na resposta de login
 */
const tenantSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  status: z.string(),
  role: z.string(),
  joinedAt: z.coerce.date(),
});

/**
 * Schema para resposta de autenticação
 *
 * - Se o usuário tem exatamente 1 tenant, `tenant` vem preenchido e o token já é tenant-scoped
 * - `tenants` sempre lista os tenants disponíveis (para exibir selector ou confirmar auto-seleção)
 */
export const authResponseSchema = z.object({
  user: userResponseSchema,
  sessionId: idSchema,
  token: z.string(),
  refreshToken: z.string(),
  tenant: tenantSummarySchema.nullable(),
  tenants: z.array(tenantSummarySchema),
});
