import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { teamCalendarPermissionsSchema } from '@/http/schemas/calendar';
import { prisma } from '@/lib/prisma';
import { makeUpdateTeamCalendarPermissionsUseCase } from '@/use-cases/calendar/calendars/factories/make-update-team-calendar-permissions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateTeamCalendarPermissionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/calendar/calendars/:id/team-permissions',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.MANAGE,
        resource: 'calendars',
      }),
    ],
    schema: {
      tags: ['Calendar - Calendars'],
      summary: 'Update team calendar permissions by role',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: teamCalendarPermissionsSchema,
      response: {
        200: z.object({ message: z.string() }),
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
          where: { id: calendarId, tenantId, type: 'TEAM', deletedAt: null },
        });

        if (!calendar || !calendar.ownerId) {
          throw new ResourceNotFoundError();
        }

        const membership = await prisma.teamMember.findFirst({
          where: { teamId: calendar.ownerId, userId, tenantId, leftAt: null },
        });

        if (!membership) {
          throw new ForbiddenError();
        }

        const useCase = makeUpdateTeamCalendarPermissionsUseCase();
        await useCase.execute({
          calendarId,
          teamId: calendar.ownerId,
          teamRole: membership.role,
          permissions: request.body,
        });

        return reply.send({ message: 'Permissions updated' });
      } catch (error) {
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
