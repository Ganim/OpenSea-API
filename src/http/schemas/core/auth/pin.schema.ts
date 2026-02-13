import { z } from 'zod';

export const accessPinSchema = z
  .string()
  .length(6, 'O PIN de acesso deve ter exatamente 6 d\u00edgitos')
  .regex(/^\d+$/, 'O PIN deve conter apenas n\u00fameros');

export const actionPinSchema = z
  .string()
  .length(4, 'O PIN de a\u00e7\u00e3o deve ter exatamente 4 d\u00edgitos')
  .regex(/^\d+$/, 'O PIN deve conter apenas n\u00fameros');

export const setAccessPinBodySchema = z.object({
  currentPassword: z.string().min(1, 'Password is required'),
  newAccessPin: accessPinSchema,
});

export const setActionPinBodySchema = z.object({
  currentPassword: z.string().min(1, 'Password is required'),
  newActionPin: actionPinSchema,
});

export const verifyActionPinBodySchema = z.object({
  actionPin: actionPinSchema,
});

export const authenticateWithPinBodySchema = z.object({
  userId: z.string().uuid(),
  accessPin: accessPinSchema,
});
