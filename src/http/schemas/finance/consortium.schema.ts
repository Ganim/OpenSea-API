import { z } from 'zod';

export const createConsortiumSchema = z.object({
  name: z.string().min(1).max(128),
  administrator: z.string().min(1).max(128),
  bankAccountId: z.string().uuid(),
  costCenterId: z.string().uuid(),
  creditValue: z.number().positive(),
  monthlyPayment: z.number().positive(),
  totalInstallments: z.number().int().positive(),
  startDate: z.coerce.date(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  groupNumber: z.string().max(32).optional(),
  quotaNumber: z.string().max(32).optional(),
  contractNumber: z.string().max(64).optional(),
  notes: z.string().optional(),
});

export const updateConsortiumSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  administrator: z.string().min(1).max(128).optional(),
  contractNumber: z.string().max(64).nullable().optional(),
  notes: z.string().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export const consortiumResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  costCenterId: z.string().uuid(),
  name: z.string(),
  administrator: z.string(),
  groupNumber: z.string().optional().nullable(),
  quotaNumber: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  status: z.string(),
  creditValue: z.number(),
  monthlyPayment: z.number(),
  totalInstallments: z.number(),
  paidInstallments: z.number(),
  isContemplated: z.boolean(),
  contemplatedAt: z.coerce.date().optional().nullable(),
  contemplationType: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  paymentDay: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  progressPercentage: z.number(),
  remainingInstallments: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const consortiumPaymentResponseSchema = z.object({
  id: z.string().uuid(),
  consortiumId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional().nullable(),
  installmentNumber: z.number(),
  dueDate: z.coerce.date(),
  expectedAmount: z.number(),
  paidAmount: z.number().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  status: z.string(),
  isPaid: z.boolean(),
  isOverdue: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const listConsortiaQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z
    .enum(['ACTIVE', 'CONTEMPLATED', 'WITHDRAWN', 'COMPLETED', 'CANCELLED'])
    .optional(),
  isContemplated: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  bankAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const registerConsortiumPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  bankAccountId: z.string().uuid().optional(),
});

export const markContemplatedSchema = z.object({
  contemplationType: z.enum(['BID', 'DRAW']),
  contemplatedAt: z.coerce.date(),
});
