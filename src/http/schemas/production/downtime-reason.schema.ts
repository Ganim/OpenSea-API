import { z } from 'zod';

export const createDowntimeReasonSchema = z.object({
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(128),
  category: z.enum([
    'MACHINE',
    'MATERIAL',
    'QUALITY',
    'SETUP',
    'PLANNING',
    'MAINTENANCE',
    'OTHER',
  ]),
  isActive: z.boolean().optional(),
});

export const updateDowntimeReasonSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  category: z
    .enum([
      'MACHINE',
      'MATERIAL',
      'QUALITY',
      'SETUP',
      'PLANNING',
      'MAINTENANCE',
      'OTHER',
    ])
    .optional(),
  isActive: z.boolean().optional(),
});

export const downtimeReasonResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  category: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
});
