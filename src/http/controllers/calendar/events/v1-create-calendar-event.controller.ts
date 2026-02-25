import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createCalendarEventSchema,
  calendarEventResponseSchema,
} from '@/http/schemas/calendar';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateCalendarEventUseCase } from '@/use-cases/calendar/events/factories/make-create-calendar-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCalendarEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/calendar/events',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.CREATE,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Events'],
      summary: 'Create a new calendar event',
      security: [{ bearerAuth: [] }],
      body: createCalendarEventSchema,
      response: {
        201: z.object({ event: calendarEventResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateCalendarEventUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.EVENT_CREATE,
          entityId: result.event.id,
          placeholders: { userName, eventTitle: result.event.title },
          newData: request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
