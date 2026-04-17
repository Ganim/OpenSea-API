import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listSurveysQuerySchema,
  surveyResponseSchema,
} from '@/http/schemas/hr/surveys';
import { surveyToDTO } from '@/mappers/hr/survey';
import { makeListSurveysUseCase } from '@/use-cases/hr/surveys/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListSurveysController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/surveys',
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
      summary: 'List surveys',
      description: 'Lists all surveys with optional filters',
      querystring: listSurveysQuerySchema,
      response: {
        200: z.object({
          surveys: z.array(surveyResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListSurveysUseCase();
      const { surveys, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        surveys: surveys.map(surveyToDTO),
        total,
      });
    },
  });
}
