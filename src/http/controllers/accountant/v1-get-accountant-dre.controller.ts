import { verifyAccountant } from '@/http/middlewares/finance/verify-accountant';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

interface AccountantContext {
  id: string;
  tenantId: string;
  email: string;
  name: string;
}

export async function getAccountantDreController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/accountant/reports/dre',
    preHandler: [verifyAccountant],
    schema: {
      tags: ['Accountant Portal'],
      summary: 'Get read-only DRE (Income Statement) report',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
      }),
    },
    handler: async (request, reply) => {
      const accountant = (
        request as unknown as { accountant: AccountantContext }
      ).accountant;
      const { year } = request.query as { year: number };

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const entriesRepo = new PrismaFinanceEntriesRepository();
      const { entries } = await entriesRepo.findMany({
        tenantId: accountant.tenantId,
        dueDateFrom: startDate,
        dueDateTo: endDate,
        limit: 50000,
      });

      const paidStatuses = ['PAID', 'RECEIVED', 'PARTIALLY_PAID'];

      const revenue = entries
        .filter(
          (e) => e.type === 'RECEIVABLE' && paidStatuses.includes(e.status),
        )
        .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

      const expenses = entries
        .filter((e) => e.type === 'PAYABLE' && paidStatuses.includes(e.status))
        .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

      const netResult = revenue - expenses;

      // Monthly breakdown
      const monthly: Array<{
        month: number;
        revenue: number;
        expenses: number;
        result: number;
      }> = [];

      for (let m = 0; m < 12; m++) {
        const monthEntries = entries.filter((e) => {
          const d = new Date(e.dueDate);
          return d.getMonth() === m && paidStatuses.includes(e.status);
        });

        const monthRevenue = monthEntries
          .filter((e) => e.type === 'RECEIVABLE')
          .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

        const monthExpenses = monthEntries
          .filter((e) => e.type === 'PAYABLE')
          .reduce((sum, e) => sum + (e.actualAmount ?? e.expectedAmount), 0);

        monthly.push({
          month: m + 1,
          revenue: monthRevenue,
          expenses: monthExpenses,
          result: monthRevenue - monthExpenses,
        });
      }

      return reply.status(200).send({
        year,
        totalRevenue: revenue,
        totalExpenses: expenses,
        netResult,
        monthly,
      });
    },
  });
}
