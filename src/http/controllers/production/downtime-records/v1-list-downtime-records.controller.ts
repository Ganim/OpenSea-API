import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { downtimeRecordResponseSchema } from '@/http/schemas/production';
import { downtimeRecordToDTO } from '@/mappers/production/downtime-record-to-dto';
import { makeListDowntimeRecordsUseCase } from '@/use-cases/production/downtime-records/factories/make-list-downtime-records-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listDowntimeRecordsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/downtime-records',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.ACCESS,
        resource: 'downtime-records',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'List downtime records',
      querystring: z.object({
        workstationId: z.string().min(1),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
      response: {
        200: z.object({
          downtimeRecords: z.array(downtimeRecordResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { workstationId, startDate, endDate } = request.query;

      const listDowntimeRecordsUseCase = makeListDowntimeRecordsUseCase();
      const { downtimeRecords } = await listDowntimeRecordsUseCase.execute({
        workstationId,
        startDate,
        endDate,
      });

      return reply.status(200).send({
        downtimeRecords: downtimeRecords.map(downtimeRecordToDTO),
      });
    },
  });
}
