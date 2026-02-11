import { z } from 'zod';

export const createBankAccountSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1).max(128),
  bankCode: z.string().min(1).max(5),
  bankName: z.string().max(128).optional(),
  agency: z.string().min(1).max(10),
  agencyDigit: z.string().max(2).optional(),
  accountNumber: z.string().min(1).max(20),
  accountDigit: z.string().max(2).optional(),
  accountType: z.enum([
    'CHECKING',
    'SAVINGS',
    'SALARY',
    'PAYMENT',
    'INVESTMENT',
    'DIGITAL',
    'OTHER',
  ]),
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM']).optional(),
  pixKey: z.string().max(128).optional(),
  color: z.string().max(7).optional(),
  isDefault: z.boolean().optional(),
});

export const bankAccountResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string(),
  bankCode: z.string(),
  bankName: z.string().optional().nullable(),
  agency: z.string(),
  agencyDigit: z.string().optional().nullable(),
  accountNumber: z.string(),
  accountDigit: z.string().optional().nullable(),
  accountType: z.string(),
  status: z.string(),
  pixKeyType: z.string().optional().nullable(),
  pixKey: z.string().optional().nullable(),
  currentBalance: z.number(),
  balanceUpdatedAt: z.coerce.date().optional().nullable(),
  color: z.string().optional().nullable(),
  isDefault: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const updateBankAccountSchema = createBankAccountSchema
  .omit({ companyId: true })
  .partial();
