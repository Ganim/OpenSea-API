import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createDowntimeRecordSchema,
  downtimeRecordResponseSchema,
} from '@/http/schemas/production';
import { downtimeRecordToDTO } from '@/mappers/production/downtime-record-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateDowntimeRecordUseCase } from '@/use-cases/production/downtime-records/factories/make-create-downtime-record-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createDowntimeRecordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/downtime-records',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.REGISTER,
        resource: 'downtime-records',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'Create a downtime record',
      body: createDowntimeRecordSchema,
      response: {
        201: z.object({
          downtimeRecord: downtimeRecordResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { workstationId, downtimeReasonId, startTime, endTime, notes } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createDowntimeRecordUseCase = makeCreateDowntimeRecordUseCase();
      const { downtimeRecord } = await createDowntimeRecordUseCase.execute({
        workstationId,
        downtimeReasonId,
        startTime,
        endTime,
        reportedById: userId,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DOWNTIME_RECORD_CREATE,
        entityId: downtimeRecord.downtimeRecordId.toString(),
        placeholders: { userName, workstationName: workstationId },
        newData: {
          workstationId,
          downtimeReasonId,
          startTime,
          endTime,
          notes,
        },
      });

      return reply
        .status(201)
        .send({ downtimeRecord: downtimeRecordToDTO(downtimeRecord) });
    },
  });
}
