import { z } from 'zod';

export const exportAccountingSchema = z.object({
  format: z.enum(['CSV']).default('CSV'),
  reportType: z.enum(['ENTRIES', 'BALANCE', 'DRE', 'CASHFLOW']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: z.enum(['PAYABLE', 'RECEIVABLE']).optional(),
  costCenterId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});
