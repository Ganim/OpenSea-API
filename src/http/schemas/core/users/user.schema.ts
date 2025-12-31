/**
 * User Zod Schemas
 * Schemas reutilizáveis para validação de usuários
 */

import { z } from 'zod';
import {
  dateSchema,
  emailSchema,
  idSchema,
  nameSchema,
  strongPasswordSchema,
  urlSchema,
  usernameSchema,
} from '../../common.schema';

/**
 * Schema para criação de usuário
 */
export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: strongPasswordSchema,
});

/**
 * Schema para atualização de email
 */
export const updateEmailSchema = z.object({
  email: emailSchema,
});

/**
 * Schema para atualização de username
 */
export const updateUsernameSchema = z.object({
  username: usernameSchema,
});

/**
 * Schema para atualização de senha
 */
export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: strongPasswordSchema,
});

/**
 * Schema para perfil de usuário
 */
export const userProfileSchema = z.object({
  name: nameSchema.optional(),
  surname: nameSchema.optional(),
  birthday: dateSchema.optional(),
  location: z.string().max(200).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: urlSchema.optional(),
});

/**
 * Schema para atualização de perfil
 */
export const updateProfileSchema = userProfileSchema.partial();

/**
 * Schema para resposta de usuário (sem senha)
 */
export const userResponseSchema = z.object({
  id: idSchema,
  username: z.string(),
  email: z.string(),
  lastLoginAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable().optional(),
  profile: z
    .object({
      id: idSchema,
      userId: idSchema,
      name: z.string(),
      surname: z.string(),
      birthday: z.coerce.date().optional(),
      location: z.string(),
      bio: z.string(),
      avatarUrl: z.string(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
    })
    .nullable()
    .optional(),
});
