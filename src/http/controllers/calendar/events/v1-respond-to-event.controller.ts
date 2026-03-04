import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { respondToEventSchema } from '@/http/schemas/calendar';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeRespondToEventUseCase } from '@/use-cases/calendar/events/factories/make-respond-to-event-use-case';
import { makeGetCalendarEventByIdUseCase } from '@/use-cases/calendar/events/factories/make-get-calendar-event-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function respondToEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/calendar/events/:eventId/respond',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.PARTICIPANTS.RESPOND,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Participants'],
      summary: 'Respond to an event invitation (RSVP)',
      security: [{ bearerAuth: [] }],
      params: z.object({ eventId: z.string().uuid() }),
      body: respondToEventSchema,
      response: {
        200: z.object({
          participantId: z.string().uuid(),
          status: z.string(),
        }),
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

        const useCase = makeRespondToEventUseCase();
        const result = await useCase.execute({
          eventId,
          tenantId,
          userId,
          userName,
          status: request.body.status,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.PARTICIPANT_RESPOND,
          entityId: eventId,
          placeholders: {
            userName,
            eventTitle: event.title,
            status: request.body.status,
          },
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
