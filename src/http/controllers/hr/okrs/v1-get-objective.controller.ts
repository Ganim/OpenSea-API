import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { objectiveResponseSchema } from '@/http/schemas/hr/okrs';
import { idSchema } from '@/http/schemas/common.schema';
import { objectiveToDTO } from '@/mappers/hr/objective';
import { makeGetObjectiveUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetObjectiveController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/okrs/objectives/:objectiveId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'Get an objective',
      description: 'Gets an OKR objective by ID',
      params: z.object({ objectiveId: idSchema }),
      response: {
        200: objectiveResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { objectiveId } = request.params;

      const useCase = makeGetObjectiveUseCase();
      const { objective } = await useCase.execute({ tenantId, objectiveId });

      return reply.status(200).send(objectiveToDTO(objective));
    },
  });
}
