import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateSurveySchema,
  surveyResponseSchema,
} from '@/http/schemas/hr/surveys';
import { cuidSchema } from '@/http/schemas/common.schema';
import { surveyToDTO } from '@/mappers/hr/survey';
import { makeUpdateSurveyUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateSurveyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/surveys/:surveyId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SURVEYS.MODIFY,
        resource: 'surveys',
      }),
    ],
    schema: {
      tags: ['HR - Surveys'],
      summary: 'Update a survey',
      description: 'Updates a draft survey',
      params: z.object({ surveyId: cuidSchema }),
      body: updateSurveySchema,
      response: {
        200: surveyResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { surveyId } = request.params;

      const useCase = makeUpdateSurveyUseCase();
      const { survey } = await useCase.execute({
        tenantId,
        surveyId,
        ...request.body,
      });

      return reply.status(200).send(surveyToDTO(survey));
    },
  });
}
