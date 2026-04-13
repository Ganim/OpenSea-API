import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { defectRecordResponseSchema } from '@/http/schemas/production';
import { defectRecordToDTO } from '@/mappers/production/defect-record-to-dto';
import { makeListDefectRecordsUseCase } from '@/use-cases/production/defect-records/factories/make-list-defect-records-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listDefectRecordsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/defect-records',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.ACCESS,
        resource: 'defect-records',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'List defect records',
      querystring: z.object({
        inspectionResultId: z.string(),
      }),
      response: {
        200: z.object({
          defectRecords: z.array(defectRecordResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { inspectionResultId } = request.query;

      const listDefectRecordsUseCase = makeListDefectRecordsUseCase();
      const { defectRecords } = await listDefectRecordsUseCase.execute({
        inspectionResultId,
      });

      return reply.status(200).send({
        defectRecords: defectRecords.map(defectRecordToDTO),
      });
    },
  });
}
