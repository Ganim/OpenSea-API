import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateCalendarEventSchema,
  calendarEventResponseSchema,
} from '@/http/schemas/calendar';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateCalendarEventUseCase } from '@/use-cases/calendar/events/factories/make-update-calendar-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCalendarEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/calendar/events/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.UPDATE,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Events'],
      summary: 'Update a calendar event',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: updateCalendarEventSchema,
      response: {
        200: z.object({ event: calendarEventResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateCalendarEventUseCase();
        const result = await useCase.execute({
          id,
          tenantId,
          userId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.EVENT_UPDATE,
          entityId: result.event.id,
          placeholders: { userName, eventTitle: result.event.title },
          newData: request.body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
