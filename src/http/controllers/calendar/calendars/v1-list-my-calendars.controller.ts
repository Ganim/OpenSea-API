import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { calendarResponseSchema } from '@/http/schemas/calendar';
import { prisma } from '@/lib/prisma';
import { makeListMyCalendarsUseCase } from '@/use-cases/calendar/calendars/factories/make-list-my-calendars-use-case';
import { makeCreatePersonalCalendarUseCase } from '@/use-cases/calendar/calendars/factories/make-create-personal-calendar-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listMyCalendarsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/calendar/calendars',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.LIST,
        resource: 'calendars',
      }),
    ],
    schema: {
      tags: ['Calendar - Calendars'],
      summary: 'List my calendars (personal + team + system)',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ calendars: z.array(calendarResponseSchema) }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      // Ensure personal calendar exists
      const createPersonal = makeCreatePersonalCalendarUseCase();
      await createPersonal.execute({ tenantId, userId });

      // Get user's team memberships with team info
      const memberships = await prisma.teamMember.findMany({
        where: { userId, tenantId, leftAt: null },
        select: {
          teamId: true,
          role: true,
          team: { select: { name: true, color: true } },
        },
      });

      const teamMemberships = memberships.map((m) => ({
        teamId: m.teamId,
        role: m.role,
      }));

      // Build team info map for DTO enrichment
      const teamInfoMap = new Map(
        memberships.map((m) => [
          m.teamId,
          { name: m.team.name, color: m.team.color },
        ]),
      );

      const useCase = makeListMyCalendarsUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        teamMemberships,
        teamInfoMap,
      });

      return reply.send(result);
    },
  });
}
