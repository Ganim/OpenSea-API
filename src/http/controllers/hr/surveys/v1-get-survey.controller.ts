import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { surveyResponseSchema } from '@/http/schemas/hr/surveys';
import { cuidSchema } from '@/http/schemas/common.schema';
import { surveyToDTO } from '@/mappers/hr/survey';
import { makeGetSurveyUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetSurveyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/surveys/:surveyId',
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
      summary: 'Get a survey',
      description: 'Gets a survey by ID',
      params: z.object({ surveyId: cuidSchema }),
      response: {
        200: surveyResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { surveyId } = request.params;

      const useCase = makeGetSurveyUseCase();
      const { survey } = await useCase.execute({ tenantId, surveyId });

      return reply.status(200).send(surveyToDTO(survey));
    },
  });
}
