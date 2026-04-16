import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const activityEnum = z.enum(['OPERATING', 'INVESTING', 'FINANCING']);

const monthlyRowSchema = z.object({
  month: z.number().int().min(1).max(12),
  operating: z.number(),
  investing: z.number(),
  financing: z.number(),
  net: z.number(),
});

const categoryRowSchema = z.object({
  activity: activityEnum,
  categoryId: z.string(),
  categoryName: z.string(),
  inflow: z.number(),
  outflow: z.number(),
  net: z.number(),
});

const dfcResponseSchema = z.object({
  year: z.number().int(),
  operating: z.number(),
  investing: z.number(),
  financing: z.number(),
  netCashFlow: z.number(),
  monthly: z.array(monthlyRowSchema),
  categories: z.array(categoryRowSchema),
});

const PAID_STATUSES = ['PAID', 'RECEIVED', 'PARTIALLY_PAID'] as const;

const INVESTING_KEYWORDS = [
  'imobiliz',
  'investiment',
  'ativo-fixo',
  'aquisic',
  'venda-ativo',
  'equipamento',
  'capex',
];

const FINANCING_KEYWORDS = [
  'emprest',
  'financiam',
  'mutuo',
  'dividend',
  'aporte',
  'capital',
  'juros-emprest',
  'principal-emprest',
  'consortio',
];

export type DfcActivity = 'OPERATING' | 'INVESTING' | 'FINANCING';

export function classifyActivity(
  categoryName: string,
  categorySlug: string | null | undefined,
): DfcActivity {
  const haystack = `${categoryName} ${categorySlug ?? ''}`
    .toLowerCase()
    .replace(/[áâã]/g, 'a')
    .replace(/[éê]/g, 'e')
    .replace(/[íî]/g, 'i')
    .replace(/[óôõ]/g, 'o')
    .replace(/[úû]/g, 'u')
    .replace(/ç/g, 'c');

  if (INVESTING_KEYWORDS.some((k) => haystack.includes(k))) return 'INVESTING';
  if (FINANCING_KEYWORDS.some((k) => haystack.includes(k))) return 'FINANCING';
  return 'OPERATING';
}

/**
 * DFC — Demonstração dos Fluxos de Caixa.
 *
 * Groups paid receivable/payable entries of the calendar year into three
 * cash-flow activities (operating / investing / financing) based on the
 * category name + slug heuristic. Returns yearly totals, a 12-month
 * breakdown for charting and a per-category row for drill-down.
 */
export async function getDfcController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reports/dfc',
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
      summary: 'Get DFC (Demonstração dos Fluxos de Caixa)',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
      }),
      response: { 200: dfcResponseSchema },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { year } = request.query as { year: number };

      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

      // 1. Load all active categories — we need name+slug to classify.
      const categories = await prisma.financeCategory.findMany({
        where: { tenantId, deletedAt: null },
        select: { id: true, name: true, slug: true },
      });
      const categoryById = new Map(categories.map((c) => [c.id, c]));

      // 2. Load paid entries in the year.
      const entriesRepo = new PrismaFinanceEntriesRepository();
      const { entries } = await entriesRepo.findMany({
        tenantId,
        dueDateFrom: startDate,
        dueDateTo: endDate,
        limit: 50000,
      });

      const isPaid = (status: string) =>
        (PAID_STATUSES as readonly string[]).includes(status);

      const monthlyAcc = Array.from({ length: 12 }, () => ({
        OPERATING: 0,
        INVESTING: 0,
        FINANCING: 0,
      }));

      const categoryAcc = new Map<
        string,
        {
          activity: DfcActivity;
          categoryId: string;
          categoryName: string;
          inflow: number;
          outflow: number;
        }
      >();

      let operating = 0;
      let investing = 0;
      let financing = 0;

      for (const e of entries) {
        if (!isPaid(e.status)) continue;
        const amount = e.actualAmount ?? e.expectedAmount;
        const signed = e.type === 'RECEIVABLE' ? amount : -amount;
        const monthIdx = new Date(e.dueDate).getMonth();

        const cat = categoryById.get(e.categoryId);
        const activity = classifyActivity(cat?.name ?? '', cat?.slug ?? null);

        monthlyAcc[monthIdx][activity] += signed;

        if (activity === 'OPERATING') operating += signed;
        else if (activity === 'INVESTING') investing += signed;
        else financing += signed;

        const existing = categoryAcc.get(e.categoryId) ?? {
          activity,
          categoryId: e.categoryId,
          categoryName: cat?.name ?? 'Sem categoria',
          inflow: 0,
          outflow: 0,
        };
        if (e.type === 'RECEIVABLE') existing.inflow += amount;
        else existing.outflow += amount;
        categoryAcc.set(e.categoryId, existing);
      }

      const monthly = monthlyAcc.map((row, i) => ({
        month: i + 1,
        operating: row.OPERATING,
        investing: row.INVESTING,
        financing: row.FINANCING,
        net: row.OPERATING + row.INVESTING + row.FINANCING,
      }));

      const categoriesOut = Array.from(categoryAcc.values())
        .map((c) => ({
          activity: c.activity,
          categoryId: c.categoryId,
          categoryName: c.categoryName,
          inflow: c.inflow,
          outflow: c.outflow,
          net: c.inflow - c.outflow,
        }))
        .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

      return reply.status(200).send({
        year,
        operating,
        investing,
        financing,
        netCashFlow: operating + investing + financing,
        monthly,
        categories: categoriesOut,
      });
    },
  });
}
