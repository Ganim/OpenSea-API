import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { manageRemindersSchema } from '@/http/schemas/calendar';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeManageRemindersUseCase } from '@/use-cases/calendar/events/factories/make-manage-reminders-use-case';
import { makeGetCalendarEventByIdUseCase } from '@/use-cases/calendar/events/factories/make-get-calendar-event-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function manageRemindersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/calendar/events/:eventId/reminders',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.CALENDAR.MODIFY,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Reminders'],
      summary: 'Manage reminders for an event',
      security: [{ bearerAuth: [] }],
      params: z.object({ eventId: z.string().uuid() }),
      body: manageRemindersSchema,
      response: {
        200: z.object({ count: z.number() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { eventId } = request.params;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const getEventUseCase = makeGetCalendarEventByIdUseCase();
        const { event } = await getEventUseCase.execute({
          id: eventId,
          tenantId,
          userId,
        });

        const useCase = makeManageRemindersUseCase();
        const result = await useCase.execute({
          eventId,
          tenantId,
          userId,
          reminders: request.body.reminders,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.REMINDERS_MANAGE,
          entityId: eventId,
          placeholders: { userName, eventTitle: event.title },
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
