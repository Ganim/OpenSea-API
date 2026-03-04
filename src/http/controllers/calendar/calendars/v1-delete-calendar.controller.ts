import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import { makeDeleteCalendarUseCase } from '@/use-cases/calendar/calendars/factories/make-delete-calendar-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCalendarController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/calendar/calendars/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.DELETE,
        resource: 'calendars',
      }),
    ],
    schema: {
      tags: ['Calendar - Calendars'],
      summary: 'Delete a team calendar (soft delete)',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null().describe('No Content'),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id: calendarId } = request.params;

      try {
        const calendar = await prisma.calendar.findFirst({
          where: { id: calendarId, tenantId, deletedAt: null },
        });

        let teamRole: string | null = null;
        if (calendar?.type === 'TEAM' && calendar.ownerId) {
          const membership = await prisma.teamMember.findFirst({
            where: { teamId: calendar.ownerId, userId, tenantId, leftAt: null },
          });
          teamRole = membership?.role ?? null;
        }

        const useCase = makeDeleteCalendarUseCase();
        await useCase.execute({ calendarId, tenantId, userId, teamRole });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.CALENDAR_DELETE,
          entityId: calendarId,
          placeholders: {
            userName: userId,
            calendarName: calendar?.name ?? '',
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: 'Not allowed' });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: 'Calendar not found' });
        }
        throw error;
      }
    },
  });
}
