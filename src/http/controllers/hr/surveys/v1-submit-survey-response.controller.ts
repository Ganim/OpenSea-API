import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  submitSurveyResponseSchema,
  surveyResponseItemSchema,
} from '@/http/schemas/hr/surveys';
import { cuidSchema } from '@/http/schemas/common.schema';
import { surveyResponseToDTO } from '@/mappers/hr/survey-response';
import { makeSubmitSurveyResponseUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1SubmitSurveyResponseController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/surveys/:surveyId/responses',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SURVEYS.ACCESS,
        resource: 'surveys',
      }),
    ],
    schema: {
      tags: ['HR - Surveys'],
      summary: 'Submit a survey response',
      description: 'Submits a response with answers to an active survey',
      params: z.object({ surveyId: cuidSchema }),
      body: submitSurveyResponseSchema,
      response: {
        201: surveyResponseItemSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { surveyId } = request.params;
      const { employeeId, answers } = request.body;

      const useCase = makeSubmitSurveyResponseUseCase();
      const { surveyResponse } = await useCase.execute({
        tenantId,
        surveyId,
        employeeId,
        answers,
      });

      return reply.status(201).send(surveyResponseToDTO(surveyResponse));
    },
  });
}
