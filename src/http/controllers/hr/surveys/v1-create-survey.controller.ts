import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createSurveySchema,
  surveyResponseSchema,
} from '@/http/schemas/hr/surveys';
import { surveyToDTO } from '@/mappers/hr/survey';
import { makeCreateSurveyUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1CreateSurveyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/surveys',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SURVEYS.REGISTER,
        resource: 'surveys',
      }),
    ],
    schema: {
      tags: ['HR - Surveys'],
      summary: 'Create a survey',
      description: 'Creates a new employee survey (clima/engagement)',
      body: createSurveySchema,
      response: {
        201: surveyResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { title, description, type, isAnonymous, startDate, endDate } =
        request.body;

      const useCase = makeCreateSurveyUseCase();
      const { survey } = await useCase.execute({
        tenantId,
        title,
        description,
        type,
        isAnonymous,
        startDate,
        endDate,
        createdBy: request.user.sub,
      });

      return reply.status(201).send(surveyToDTO(survey));
    },
  });
}
