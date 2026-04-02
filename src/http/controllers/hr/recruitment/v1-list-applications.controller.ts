import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  applicationResponseSchema,
  listApplicationsQuerySchema,
} from '@/http/schemas/hr/recruitment';
import { applicationToDTO } from '@/mappers/hr/application';
import { makeListApplicationsUseCase } from '@/use-cases/hr/applications/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListApplicationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/applications',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'List applications',
      description: 'Lists all applications with optional filters',
      querystring: listApplicationsQuerySchema,
      response: {
        200: z.object({
          applications: z.array(applicationResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;
      const useCase = makeListApplicationsUseCase();
      const { applications, total } = await useCase.execute({
        tenantId,
        ...filters,
      });
      return reply
        .status(200)
        .send({ applications: applications.map(applicationToDTO), total });
    },
  });
}
