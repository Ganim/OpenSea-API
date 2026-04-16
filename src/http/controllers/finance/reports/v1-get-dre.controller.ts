import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const monthlyRowSchema = z.object({
  month: z.number().int().min(1).max(12),
  revenue: z.number(),
  expenses: z.number(),
  result: z.number(),
});

const dreResponseSchema = z.object({
  year: z.number().int(),
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  netResult: z.number(),
  netMargin: z.number().describe('Margem líquida (resultado / receita)'),
  monthly: z.array(monthlyRowSchema),
});

const PAID_STATUSES = ['PAID', 'RECEIVED', 'PARTIALLY_PAID'] as const;

/**
 * DRE — Demonstração do Resultado do Exercício.
 *
 * Tenant-scoped version of the accountant-portal DRE: aggregates paid
 * receivable/payable lançamentos within the calendar year and returns yearly
 * totals plus a 12-month breakdown for charting. The accountant route
 * (`/v1/accountant/reports/dre`) keeps its read-only role for external CPAs.
 */
export async function getDreController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reports/dre',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.REPORTS.ACCESS,
        resource: 'reports',
      }),
    ],
    schema: {
      tags: ['Finance - Reports'],
      summary: 'Get DRE (Demonstração do Resultado do Exercício)',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
      }),
      response: { 200: dreResponseSchema },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { year } = request.query as { year: number };

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      const entriesRepo = new PrismaFinanceEntriesRepository();
      const { entries } = await entriesRepo.findMany({
        tenantId,
        dueDateFrom: startDate,
        dueDateTo: endDate,
        limit: 50000,
      });

      const isPaid = (status: string) =>
        (PAID_STATUSES as readonly string[]).includes(status);

      let totalRevenue = 0;
      let totalExpenses = 0;
      const monthlyAcc = Array.from({ length: 12 }, () => ({
        revenue: 0,
        expenses: 0,
      }));

      for (const e of entries) {
        if (!isPaid(e.status)) continue;
        const amount = e.actualAmount ?? e.expectedAmount;
        const monthIdx = new Date(e.dueDate).getMonth();
        if (e.type === 'RECEIVABLE') {
          totalRevenue += amount;
          monthlyAcc[monthIdx].revenue += amount;
        } else if (e.type === 'PAYABLE') {
          totalExpenses += amount;
          monthlyAcc[monthIdx].expenses += amount;
        }
      }

      const netResult = totalRevenue - totalExpenses;
      const netMargin = totalRevenue > 0 ? netResult / totalRevenue : 0;

      const monthly = monthlyAcc.map((row, i) => ({
        month: i + 1,
        revenue: row.revenue,
        expenses: row.expenses,
        result: row.revenue - row.expenses,
      }));

      return reply.status(200).send({
        year,
        totalRevenue,
        totalExpenses,
        netResult,
        netMargin,
        monthly,
      });
    },
  });
}
