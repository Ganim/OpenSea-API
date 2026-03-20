import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { calendarResponseSchema } from '@/http/schemas/calendar';
import { prisma } from '@/lib/prisma';
import { makeGetCalendarByIdUseCase } from '@/use-cases/calendar/calendars/factories/make-get-calendar-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getCalendarController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/calendar/calendars/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.CALENDAR.ACCESS,
        resource: 'calendars',
      }),
    ],
    schema: {
      tags: ['Calendar - Calendars'],
      summary: 'Get calendar details',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ calendar: calendarResponseSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id: calendarId } = request.params;

      try {
        // Resolve team role if applicable
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

        const useCase = makeGetCalendarByIdUseCase();
        const result = await useCase.execute({
          calendarId,
          tenantId,
          userId,
          teamRole,
        });

        return reply.send(result);
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: 'Sem permissão' });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply
            .status(404)
            .send({ message: 'Calendário não encontrado' });
        }
        throw error;
      }
    },
  });
}
