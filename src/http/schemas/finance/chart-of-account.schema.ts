import { z } from 'zod';

const accountTypeEnum = z.enum([
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
]);
const accountClassEnum = z.enum([
  'CURRENT',
  'NON_CURRENT',
  'OPERATIONAL',
  'FINANCIAL',
  'OTHER',
]);
const accountNatureEnum = z.enum(['DEBIT', 'CREDIT']);

export const createChartOfAccountSchema = z.object({
  code: z
    .string()
    .min(1)
    .max(20)
    .regex(
      /^\d+(\.\d+)*$/,
      'Código deve seguir formato hierárquico (ex: 1.1.1.01)',
    ),
  name: z.string().min(1).max(128),
  type: accountTypeEnum,
  accountClass: accountClassEnum,
  nature: accountNatureEnum,
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  isSystem: z.boolean().optional(),
});

export const chartOfAccountResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: accountTypeEnum,
  accountClass: accountClassEnum,
  nature: accountNatureEnum,
  parentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean(),
  isSystem: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const updateChartOfAccountSchema = createChartOfAccountSchema
  .partial()
  .omit({ isSystem: true });

export const balanceSheetQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

const accountBalanceSchema = z.object({
  accountId: z.string(),
  code: z.string(),
  name: z.string(),
  balance: z.number(),
});

export const balanceSheetResponseSchema = z.object({
  period: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
  assets: z.object({
    current: z.array(accountBalanceSchema),
    nonCurrent: z.array(accountBalanceSchema),
    total: z.number(),
  }),
  liabilities: z.object({
    current: z.array(accountBalanceSchema),
    nonCurrent: z.array(accountBalanceSchema),
    total: z.number(),
  }),
  equity: z.object({
    items: z.array(accountBalanceSchema),
    total: z.number(),
  }),
  totalLiabilitiesAndEquity: z.number(),
  isBalanced: z.boolean(),
});
