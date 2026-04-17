import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  medicalExamResponseSchema,
  listExpiringExamsQuerySchema,
} from '@/http/schemas';
import { medicalExamToDTO } from '@/mappers/hr/medical-exam';
import { makeListExpiringExamsUseCase } from '@/use-cases/hr/medical-exams/factories/make-list-expiring-exams-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListExpiringExamsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/medical-exams/expiring',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.MEDICAL_EXAMS.ACCESS,
        resource: 'medical-exams',
      }),
    ],
    schema: {
      tags: ['HR - Medical Exams'],
      summary: 'List expiring medical exams',
      description:
        'Lists medical exams that are expiring within the specified threshold (default: 30 days)',
      querystring: listExpiringExamsQuerySchema,
      response: {
        200: z.object({
          expiringExams: z.array(medicalExamResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { daysThreshold } = request.query;

      const useCase = makeListExpiringExamsUseCase();
      const { expiringExams } = await useCase.execute({
        tenantId,
        daysThreshold,
      });

      return reply.status(200).send({
        expiringExams: expiringExams.map(medicalExamToDTO),
      });
    },
  });
}
