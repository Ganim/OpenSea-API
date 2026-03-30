import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeValidateSimplesNacionalUseCase } from '@/use-cases/finance/compliance/factories/make-validate-simples-nacional-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const simplesNacionalQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  companyId: z.string().uuid().optional(),
});

export async function validateSimplesNacionalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/compliance/simples-nacional',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COMPLIANCE.ACCESS,
        resource: 'compliance',
      }),
    ],
    schema: {
      tags: ['Finance - Compliance'],
      summary:
        'Validate Simples Nacional annual revenue against the R$ 4.8M limit',
      security: [{ bearerAuth: [] }],
      querystring: simplesNacionalQuerySchema,
      response: {
        200: z.object({
          regime: z.string(),
          annualRevenue: z.number(),
          limit: z.number(),
          percentUsed: z.number(),
          status: z.enum(['OK', 'WARNING', 'EXCEEDED']),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        year: number;
        companyId?: string;
      };

      const useCase = makeValidateSimplesNacionalUseCase();
      const result = await useCase.execute({
        tenantId,
        year: query.year,
        companyId: query.companyId,
      });

      return reply.status(200).send(result);
    },
  });
}
