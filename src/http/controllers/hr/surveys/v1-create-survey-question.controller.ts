import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createSurveyQuestionSchema,
  surveyQuestionResponseSchema,
} from '@/http/schemas/hr/surveys';
import { cuidSchema } from '@/http/schemas/common.schema';
import { surveyQuestionToDTO } from '@/mappers/hr/survey-question';
import { makeCreateSurveyQuestionUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateSurveyQuestionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/surveys/:surveyId/questions',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Surveys'],
      summary: 'Add a question to a survey',
      description: 'Creates a new question for a draft survey',
      params: z.object({ surveyId: cuidSchema }),
      body: createSurveyQuestionSchema,
      response: {
        201: surveyQuestionResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { surveyId } = request.params;

      const useCase = makeCreateSurveyQuestionUseCase();
      const { question } = await useCase.execute({
        tenantId,
        surveyId,
        ...request.body,
      });

      return reply.status(201).send(surveyQuestionToDTO(question));
    },
  });
}
