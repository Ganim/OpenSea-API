import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateCalendarSchema,
  calendarResponseSchema,
} from '@/http/schemas/calendar';
import { prisma } from '@/lib/prisma';
import { makeUpdateCalendarUseCase } from '@/use-cases/calendar/calendars/factories/make-update-calendar-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCalendarController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/calendar/calendars/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.UPDATE,
        resource: 'calendars',
      }),
    ],
    schema: {
      tags: ['Calendar - Calendars'],
      summary: 'Update a calendar',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: updateCalendarSchema,
      response: {
        200: z.object({ calendar: calendarResponseSchema }),
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
        // Check if user has a team role for this calendar
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

        const useCase = makeUpdateCalendarUseCase();
        const result = await useCase.execute({
          calendarId,
          tenantId,
          userId,
          teamRole,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.CALENDAR_UPDATE,
          entityId: calendarId,
          placeholders: {
            userName: userId,
            calendarName: result.calendar.name,
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
          return reply.status(404).send({ message: 'Calendar not found' });
        }
        throw error;
      }
    },
  });
}
