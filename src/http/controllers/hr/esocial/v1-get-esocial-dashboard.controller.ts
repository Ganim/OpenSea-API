import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { GetEsocialDashboardUseCase } from '@/use-cases/hr/esocial/get-esocial-dashboard';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetEsocialDashboardController(app: FastifyInstance) {
  const useCase = new GetEsocialDashboardUseCase();

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/esocial/dashboard',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - eSocial'],
      summary: 'Get eSocial dashboard KPIs',
      description:
        'Returns dashboard data including event counts, certificate status, and recent rejections',
      response: {
        200: z.any(),
        500: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const tenantId = request.user.tenantId!;
        const result = await useCase.execute({ tenantId });
        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro interno';
        return reply.status(500).send({ message });
      }
    },
  });
}
