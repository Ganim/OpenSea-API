import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { shareEventWithUsersSchema } from '@/http/schemas/calendar';
import { makeShareEventWithUsersUseCase } from '@/use-cases/calendar/events/factories/make-share-event-with-users-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function shareEventWithUsersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/calendar/events/:eventId/share-users',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.SHARE_USERS,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Sharing'],
      summary: 'Share an event with specific users',
      security: [{ bearerAuth: [] }],
      params: z.object({ eventId: z.string().uuid() }),
      body: shareEventWithUsersSchema,
      response: {
        200: z.object({ shared: z.number() }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { eventId } = request.params;

      try {
        const useCase = makeShareEventWithUsersUseCase();
        const result = await useCase.execute({
          eventId,
          tenantId,
          userId,
          targetUserIds: request.body.userIds,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.EVENT_SHARE_USER,
          entityId: eventId,
          placeholders: {
            userName: userId,
            eventTitle: eventId,
            targetUserName: request.body.userIds.join(', '),
          },
          newData: request.body,
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: 'Not allowed' });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: 'Event not found' });
        }
        throw error;
      }
    },
  });
}
