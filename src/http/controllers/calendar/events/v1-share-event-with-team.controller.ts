import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { shareEventWithTeamSchema } from '@/http/schemas/calendar';
import { makeShareEventWithTeamUseCase } from '@/use-cases/calendar/events/factories/make-share-event-with-team-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function shareEventWithTeamController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/calendar/events/:eventId/share-team',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.CALENDAR.SHARE,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Sharing'],
      summary: 'Share an event with all members of a team',
      security: [{ bearerAuth: [] }],
      params: z.object({ eventId: z.string().uuid() }),
      body: shareEventWithTeamSchema,
      response: {
        200: z.object({ shared: z.number() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { eventId } = request.params;
      const { teamId } = request.body;

      try {
        const useCase = makeShareEventWithTeamUseCase();
        const result = await useCase.execute({
          eventId,
          tenantId,
          userId,
          teamId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.EVENT_SHARE_TEAM,
          entityId: eventId,
          placeholders: {
            userName: userId,
            eventTitle: eventId,
            teamName: teamId,
          },
          newData: { teamId },
        });

        return reply.send(result);
      } catch (error) {
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
