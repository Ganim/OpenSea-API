import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { costCenterResponseSchema } from '@/http/schemas/finance';
import { makeListCostCentersUseCase } from '@/use-cases/finance/cost-centers/factories/make-list-cost-centers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z
    .enum(['name', 'code', 'createdAt', 'monthlyBudget', 'annualBudget'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export async function listCostCentersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/cost-centers',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COST_CENTERS.ACCESS,
        resource: 'cost-centers',
      }),
    ],
    schema: {
      tags: ['Finance - Cost Centers'],
      summary: 'List cost centers',
      security: [{ bearerAuth: [] }],
      querystring: querySchema,
      response: {
        200: z.object({
          costCenters: z.array(costCenterResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, search, isActive, sortBy, sortOrder } =
        request.query as z.infer<typeof querySchema>;

      const useCase = makeListCostCentersUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        search,
        isActive,
        sortBy,
        sortOrder,
      });

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send(result);
    },
  });
}
