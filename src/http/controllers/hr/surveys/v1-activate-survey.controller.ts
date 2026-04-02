import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { surveyResponseSchema } from '@/http/schemas/hr/surveys';
import { cuidSchema } from '@/http/schemas/common.schema';
import { surveyToDTO } from '@/mappers/hr/survey';
import { makeActivateSurveyUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ActivateSurveyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/surveys/:surveyId/activate',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Surveys'],
      summary: 'Activate a survey',
      description: 'Activates a draft survey (must have at least one question)',
      params: z.object({ surveyId: cuidSchema }),
      response: {
        200: surveyResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { surveyId } = request.params;

      const useCase = makeActivateSurveyUseCase();
      const { survey } = await useCase.execute({ tenantId, surveyId });

      return reply.status(200).send(surveyToDTO(survey));
    },
  });
}
