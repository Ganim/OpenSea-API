import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTimeEntrySchema,
  timeEntryResponseSchema,
} from '@/http/schemas/production';
import { timeEntryToDTO } from '@/mappers/production/time-entry-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateTimeEntryUseCase } from '@/use-cases/production/time-entries/factories/make-create-time-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createTimeEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/time-entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.SHOPFLOOR.REGISTER,
        resource: 'time-entries',
      }),
    ],
    schema: {
      tags: ['Production - Shop Floor'],
      summary: 'Create a time entry',
      body: createTimeEntrySchema,
      response: {
        201: z.object({
          timeEntry: timeEntryResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { jobCardId, startTime, endTime, breakMinutes, entryType, notes } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createTimeEntryUseCase = makeCreateTimeEntryUseCase();
      const { timeEntry } = await createTimeEntryUseCase.execute({
        jobCardId,
        operatorId: userId,
        startTime,
        endTime,
        breakMinutes,
        entryType,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.TIME_ENTRY_CREATE,
        entityId: timeEntry.timeEntryId.toString(),
        placeholders: { userName },
        newData: {
          jobCardId,
          startTime,
          endTime,
          breakMinutes,
          entryType,
          notes,
        },
      });

      return reply.status(201).send({ timeEntry: timeEntryToDTO(timeEntry) });
    },
  });
}
