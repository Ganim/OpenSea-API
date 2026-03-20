import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listCalendarEventsQuerySchema,
  calendarEventResponseSchema,
} from '@/http/schemas/calendar';
import { makeListCalendarEventsUseCase } from '@/use-cases/calendar/events/factories/make-list-calendar-events-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCalendarEventsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/calendar/events',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.CALENDAR.ACCESS,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Events'],
      summary: 'List calendar events within a date range',
      security: [{ bearerAuth: [] }],
      querystring: listCalendarEventsQuerySchema,
      response: {
        200: z.object({
          events: z.array(calendarEventResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeListCalendarEventsUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          ...request.query,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
