import { z } from 'zod';

export const createLoanSchema = z.object({
  name: z.string().min(1).max(128),
  type: z.enum([
    'PERSONAL',
    'BUSINESS',
    'WORKING_CAPITAL',
    'EQUIPMENT',
    'REAL_ESTATE',
    'CREDIT_LINE',
    'OTHER',
  ]),
  bankAccountId: z.string().uuid(),
  costCenterId: z.string().uuid(),
  principalAmount: z.number().positive(),
  interestRate: z.number().min(0),
  interestType: z.string().max(16).optional(),
  startDate: z.coerce.date(),
  totalInstallments: z.number().int().positive(),
  installmentDay: z.number().int().min(1).max(31).optional(),
  contractNumber: z.string().max(64).optional(),
  notes: z.string().optional(),
});

export const updateLoanSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  contractNumber: z.string().max(64).nullable().optional(),
  notes: z.string().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export const loanResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  costCenterId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  contractNumber: z.string().optional().nullable(),
  status: z.string(),
  principalAmount: z.number(),
  outstandingBalance: z.number(),
  interestRate: z.number(),
  interestType: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  totalInstallments: z.number(),
  paidInstallments: z.number(),
  installmentDay: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean(),
  isDefaulted: z.boolean(),
  progressPercentage: z.number(),
  remainingInstallments: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const loanInstallmentResponseSchema = z.object({
  id: z.string().uuid(),
  loanId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional().nullable(),
  installmentNumber: z.number(),
  dueDate: z.coerce.date(),
  principalAmount: z.number(),
  interestAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  status: z.string(),
  isPaid: z.boolean(),
  isOverdue: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const listLoansQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  type: z
    .enum([
      'PERSONAL',
      'BUSINESS',
      'WORKING_CAPITAL',
      'EQUIPMENT',
      'REAL_ESTATE',
      'CREDIT_LINE',
      'OTHER',
    ])
    .optional(),
  status: z
    .enum(['ACTIVE', 'PAID_OFF', 'DEFAULTED', 'RENEGOTIATED', 'CANCELLED'])
    .optional(),
  bankAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const registerLoanPaymentSchema = z.object({
  installmentId: z.string().uuid(),
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  bankAccountId: z.string().uuid().optional(),
});
