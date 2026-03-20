import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTeamCalendarSchema,
  calendarResponseSchema,
} from '@/http/schemas/calendar';
import { prisma } from '@/lib/prisma';
import { makeCreateTeamCalendarUseCase } from '@/use-cases/calendar/calendars/factories/make-create-team-calendar-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createTeamCalendarController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/calendar/calendars/team',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.CALENDAR.ADMIN,
        resource: 'calendars',
      }),
    ],
    schema: {
      tags: ['Calendar - Calendars'],
      summary: 'Create a team calendar',
      security: [{ bearerAuth: [] }],
      body: createTeamCalendarSchema,
      response: {
        201: z.object({ calendar: calendarResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId, name, description, color } = request.body;

      try {
        // Get user's role in the team
        const membership = await prisma.teamMember.findFirst({
          where: { teamId, userId, tenantId, leftAt: null },
        });

        if (!membership) {
          throw new ForbiddenError();
        }

        const useCase = makeCreateTeamCalendarUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          teamId,
          teamRole: membership.role,
          name,
          description,
          color,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.CALENDAR_CREATE,
          entityId: result.calendar.id,
          placeholders: { userName: userId, calendarName: name },
          newData: request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: 'Not allowed' });
        }
        throw error;
      }
    },
  });
}
