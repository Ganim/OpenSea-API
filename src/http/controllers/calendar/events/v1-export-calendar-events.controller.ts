import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeExportCalendarEventsUseCase } from '@/use-cases/calendar/events/factories/make-export-calendar-events-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { eventTypeEnum } from '@/http/schemas/calendar';

const exportQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: eventTypeEnum.optional(),
  includeSystemEvents: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  calendarId: z.string().uuid().optional(),
});

export async function exportCalendarEventsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/calendar/events/export',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.EXPORT,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Events'],
      summary: 'Export calendar events as iCal (.ics) file',
      security: [{ bearerAuth: [] }],
      querystring: exportQuerySchema,
      response: {
        200: z.string().describe('iCal file content'),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeExportCalendarEventsUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          ...request.query,
        });

        return reply
          .header('Content-Type', result.mimeType)
          .header(
            'Content-Disposition',
            `attachment; filename="${result.fileName}"`,
          )
          .send(result.data);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
