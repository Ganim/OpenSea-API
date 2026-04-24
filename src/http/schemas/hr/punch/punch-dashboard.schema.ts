/**
 * Phase 07 / Plan 07-05b — Zod schemas para os endpoints read-side do
 * dashboard do gestor.
 *
 * - GET /v1/hr/punch/dashboard/heatmap (querystring: month + employeeIds opt)
 * - GET /v1/hr/punch/dashboard/summary
 * - GET /v1/hr/punch/missing (date + page + pageSize)
 * - GET /v1/hr/punch/cell-detail (employeeId + date)
 *
 * Heatmap statuses (D-07): NORMAL | ATRASO | FALTA | EXCEÇÃO | JUSTIFICADO |
 * HORA_EXTRA. Order independente — primary é statuses[0]; HORA_EXTRA pode
 * vir como secondary stack.
 */

import { z } from 'zod';

const MONTH_REGEX = /^\d{4}-\d{2}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ──────────────────────────────────────────────────────────
// HEATMAP
// ──────────────────────────────────────────────────────────

export const heatmapStatusEnum = z.enum([
  'NORMAL',
  'ATRASO',
  'FALTA',
  'EXCEÇÃO',
  'JUSTIFICADO',
  'HORA_EXTRA',
]);

export const getHeatmapQuerySchema = z.object({
  month: z.string().regex(MONTH_REGEX, 'Use formato YYYY-MM'),
  employeeIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v == null) return undefined;
      return Array.isArray(v) ? v : [v];
    }),
});

export const heatmapCellSchema = z.object({
  rowId: z.string(),
  colId: z.string(),
  statuses: z.array(heatmapStatusEnum),
  tooltip: z.string().optional(),
  payload: z
    .object({
      employeeId: z.string(),
      date: z.string(),
      timeEntryIds: z.array(z.string()).optional(),
      approvalId: z.string().optional(),
    })
    .optional(),
});

export const heatmapResponseSchema = z.object({
  rows: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      subLabel: z.string().optional(),
    }),
  ),
  columns: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      isWeekend: z.boolean().optional(),
      isHoliday: z.boolean().optional(),
    }),
  ),
  cells: z.array(heatmapCellSchema),
});

// ──────────────────────────────────────────────────────────
// SUMMARY
// ──────────────────────────────────────────────────────────

export const summaryResponseSchema = z.object({
  pendingApprovals: z.number().int().nonnegative(),
  approvedToday: z.number().int().nonnegative(),
  missingToday: z.number().int().nonnegative(),
  devicesOnline: z.number().int().nonnegative(),
  devicesOffline: z.number().int().nonnegative(),
});

// ──────────────────────────────────────────────────────────
// LIST MISSED
// ──────────────────────────────────────────────────────────

export const listMissedQuerySchema = z.object({
  date: z.string().regex(DATE_REGEX, 'Use formato YYYY-MM-DD'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const missedPunchResponseItemSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  departmentName: z.string().nullable(),
  date: z.string(),
  expectedStartTime: z.string().nullable(),
  generatedAt: z.string(),
  resolvedAt: z.string().nullable(),
  resolutionType: z
    .enum(['LATE_PUNCH', 'MANUAL_ADJUSTMENT', 'JUSTIFIED_LEAVE', 'IGNORED'])
    .nullable(),
});

export const listMissedResponseSchema = z.object({
  items: z.array(missedPunchResponseItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

// ──────────────────────────────────────────────────────────
// CELL DETAIL
// ──────────────────────────────────────────────────────────

export const getCellDetailQuerySchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(DATE_REGEX, 'Use formato YYYY-MM-DD'),
});

export const cellDetailResponseSchema = z.object({
  timeEntries: z.array(
    z.object({
      id: z.string(),
      occurredAt: z.string(),
      type: z.string(),
    }),
  ),
  activeApproval: z
    .object({
      id: z.string(),
      status: z.string(),
      reason: z.string().nullable(),
      resolverUserId: z.string().nullable(),
      resolvedAt: z.string().nullable(),
    })
    .nullable(),
  activeRequests: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      status: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    }),
  ),
});
