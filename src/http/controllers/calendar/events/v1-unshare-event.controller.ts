import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import { makeUnshareEventUseCase } from '@/use-cases/calendar/events/factories/make-unshare-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function unshareEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/calendar/events/:eventId/share-users/:targetUserId',
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
      summary: 'Remove a shared user from an event',
      security: [{ bearerAuth: [] }],
      params: z.object({
        eventId: z.string().uuid(),
        targetUserId: z.string().uuid(),
      }),
      response: {
        200: z.object({ removed: z.boolean() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { eventId, targetUserId } = request.params;

      try {
        // Get team role if event belongs to a team calendar
        const event = await prisma.calendarEvent.findFirst({
          where: { id: eventId, tenantId, deletedAt: null },
          include: { calendar: true },
        });

        let teamRole: string | null = null;
        if (event?.calendar?.type === 'TEAM' && event.calendar.ownerId) {
          const membership = await prisma.teamMember.findFirst({
            where: {
              teamId: event.calendar.ownerId,
              userId,
              tenantId,
              leftAt: null,
            },
          });
          teamRole = membership?.role ?? null;
        }

        const useCase = makeUnshareEventUseCase();
        const result = await useCase.execute({
          eventId,
          tenantId,
          userId,
          teamRole,
          targetUserId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.EVENT_UNSHARE_USER,
          entityId: eventId,
          placeholders: {
            userName: userId,
            eventTitle: event?.title ?? '',
            targetUserName: targetUserId,
          },
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: 'Sem permissão' });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
