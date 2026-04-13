import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { timeEntryResponseSchema } from '@/http/schemas/production';
import { timeEntryToDTO } from '@/mappers/production/time-entry-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeEndTimeEntryUseCase } from '@/use-cases/production/time-entries/factories/make-end-time-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function endTimeEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/production/time-entries/:id/end',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.MODIFY,
        resource: 'time-entries',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'End a time entry',
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
          timeEntry: timeEntryResponseSchema,
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
      const endTime = (request.body as { endTime?: Date } | undefined)?.endTime;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const endTimeEntryUseCase = makeEndTimeEntryUseCase();
      const { timeEntry } = await endTimeEntryUseCase.execute({
        id,
        endTime,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.TIME_ENTRY_END,
        entityId: timeEntry.timeEntryId.toString(),
        placeholders: { userName },
      });

      return reply.status(200).send({ timeEntry: timeEntryToDTO(timeEntry) });
    },
  });
}
