import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { downtimeRecordResponseSchema } from '@/http/schemas/production';
import { downtimeRecordToDTO } from '@/mappers/production/downtime-record-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeEndDowntimeRecordUseCase } from '@/use-cases/production/downtime-records/factories/make-end-downtime-record-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function endDowntimeRecordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/downtime-records/:id/end',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.MODIFY,
        resource: 'downtime-records',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'End a downtime record',
      params: z.object({
        id: z.string(),
      }),
      body: z
        .object({
          endTime: z.coerce.date().optional(),
        })
        .optional(),
      response: {
        200: z.object({
          downtimeRecord: downtimeRecordResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;
      const endTime = (request.body as { endTime?: Date } | undefined)
        ?.endTime;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const endDowntimeRecordUseCase = makeEndDowntimeRecordUseCase();
      const { downtimeRecord } = await endDowntimeRecordUseCase.execute({
        id,
        endTime,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DOWNTIME_RECORD_END,
        entityId: downtimeRecord.downtimeRecordId.toString(),
        placeholders: {
          userName,
          workstationName: downtimeRecord.workstationId.toString(),
        },
      });

      return reply
        .status(200)
        .send({ downtimeRecord: downtimeRecordToDTO(downtimeRecord) });
    },
  });
}
