import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { interviewResponseSchema, listInterviewsQuerySchema } from '@/http/schemas/hr/recruitment';
import { interviewToDTO } from '@/mappers/hr/interview';
import { makeListInterviewsUseCase } from '@/use-cases/hr/interviews/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListInterviewsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/interviews',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'List interviews',
      description: 'Lists all interviews with optional filters',
      querystring: listInterviewsQuerySchema,
      response: { 200: z.object({ interviews: z.array(interviewResponseSchema), total: z.number() }) },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;
      const useCase = makeListInterviewsUseCase();
      const { interviews, total } = await useCase.execute({ tenantId, ...filters });
      return reply.status(200).send({ interviews: interviews.map(interviewToDTO), total });
    },
  });
}
