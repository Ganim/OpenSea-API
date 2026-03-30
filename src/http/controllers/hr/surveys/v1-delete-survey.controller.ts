import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { makeDeleteSurveyUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteSurveyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/surveys/:surveyId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Surveys'],
      summary: 'Delete a survey',
      description: 'Deletes a survey (only draft/closed)',
      params: z.object({ surveyId: idSchema }),
      response: {
        204: z.null(),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { surveyId } = request.params;

      const useCase = makeDeleteSurveyUseCase();
      await useCase.execute({ tenantId, surveyId });

      return reply.status(204).send(null);
    },
  });
}
