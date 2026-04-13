import { z } from 'zod';

// ============================================================================
// Schedule
// ============================================================================

export const createScheduleSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional().nullable(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const scheduleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================================================
// Schedule Entry
// ============================================================================

export const createScheduleEntrySchema = z.object({
  productionOrderId: z.string().optional(),
  workstationId: z.string().optional(),
  title: z.string().min(1).max(256),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  color: z.string().max(7).optional(),
  notes: z.string().max(500).optional(),
});

export const updateScheduleEntrySchema = z.object({
  title: z.string().min(1).max(256).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  workstationId: z.string().optional().nullable(),
  status: z
    .enum(['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  color: z.string().max(7).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const scheduleEntryResponseSchema = z.object({
  id: z.string(),
  scheduleId: z.string(),
  productionOrderId: z.string().nullable(),
  workstationId: z.string().nullable(),
  title: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.string(),
  color: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
