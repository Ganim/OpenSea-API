import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDetectAnomaliesUseCase } from '@/use-cases/finance/analytics/factories/make-detect-anomalies-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const querySchema = z.object({
  months: z.coerce.number().min(1).max(24).optional().default(6),
});

const anomalySchema = z.object({
  type: z.enum([
    'EXPENSE_SPIKE',
    'PRICE_INCREASE',
    'UNUSUAL_FREQUENCY',
    'NEW_HIGH_VALUE',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  entryId: z.string().optional(),
  categoryName: z.string().optional(),
  supplierName: z.string().optional(),
  currentValue: z.number(),
  expectedValue: z.number(),
  deviationPercent: z.number(),
  description: z.string(),
});

const responseSchema = z.object({
  anomalies: z.array(anomalySchema),
  analyzedPeriod: z.object({
    from: z.string(),
    to: z.string(),
  }),
  totalEntriesAnalyzed: z.number(),
  categoriesAnalyzed: z.number(),
});

export async function detectAnomaliesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/analytics/anomalies',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'analytics',
      }),
    ],
    schema: {
      tags: ['Finance - Analytics'],
      summary: 'Detect anomalies in finance entries',
      security: [{ bearerAuth: [] }],
      querystring: querySchema,
      response: {
        200: responseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { months } = request.query as { months: number };

      const useCase = makeDetectAnomaliesUseCase();
      const result = await useCase.execute({
        tenantId,
        months,
      });

      reply.header('Cache-Control', 'private, max-age=300');
      return reply.status(200).send(result);
    },
  });
}
