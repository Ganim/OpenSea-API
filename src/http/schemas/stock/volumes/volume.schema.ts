import { z } from 'zod';

export const volumeStatusSchema = z.enum([
  'OPEN',
  'CLOSED',
  'DELIVERED',
  'RETURNED',
]);

export const createVolumeSchema = z.object({
  code: z.string().min(1, 'Codigo do volume e obrigatorio').max(256),
  name: z.string().max(256).optional(),
  notes: z.string().optional(),
  destinationRef: z.string().max(256).optional(),
  salesOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: volumeStatusSchema.optional(),
});

// Schema para body de criacao (codigo gerado automaticamente)
export const createVolumeBodySchema = z.object({
  name: z.string().max(256).optional(),
  notes: z.string().optional(),
  destinationRef: z.string().max(256).optional(),
  salesOrderId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  status: volumeStatusSchema.optional(),
});

export const updateVolumeSchema = z.object({
  name: z.string().max(256).optional(),
  notes: z.string().optional(),
  destinationRef: z.string().max(256).optional(),
  status: volumeStatusSchema.optional(),
});

export const listVolumesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  status: volumeStatusSchema.optional(),
});

export const listVolumesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  status: volumeStatusSchema.optional(),
});

export const addItemToVolumeSchema = z.object({
  itemId: z.string().uuid('ID do item deve ser um UUID valido'),
});

export const volumeResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string().nullable(),
  status: z.string(),
  statusLabel: z.string(),
  notes: z.string().nullable(),
  destinationRef: z.string().nullable(),
  salesOrderId: z.string().nullable(),
  customerId: z.string().nullable(),
  itemCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  closedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  returnedAt: z.string().nullable(),
  closedBy: z.string().nullable(),
  deliveredBy: z.string().nullable(),
});

export const volumeItemResponseSchema = z.object({
  id: z.string().uuid(),
  volumeId: z.string().uuid(),
  itemId: z.string().uuid(),
  addedAt: z.string(),
  addedBy: z.string(),
});

export const romaneioResponseSchema = z.object({
  volumeId: z.string().uuid(),
  volumeCode: z.string(),
  totalItems: z.number(),
  items: z.array(volumeItemResponseSchema),
  generatedAt: z.string(),
});
