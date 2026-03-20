import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { checkInlinePermission } from '@/http/helpers/check-inline-permission';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetCalendarEventByIdUseCase } from '@/use-cases/calendar/events/factories/make-get-calendar-event-by-id-use-case';
import { makeDeleteCalendarEventUseCase } from '@/use-cases/calendar/events/factories/make-delete-calendar-event-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCalendarEventController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/calendar/events/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.CALENDAR.REMOVE,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Events'],
      summary: 'Delete a calendar event (soft delete)',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        // Get event title for audit before deleting
        const getUseCase = makeGetCalendarEventByIdUseCase();
        const { event: existingEvent } = await getUseCase.execute({
          id,
          tenantId,
          userId,
        });

        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        let hasManagePermission = false;
        try {
          await checkInlinePermission(
            request,
            PermissionCodes.TOOLS.CALENDAR.ADMIN,
          );
          hasManagePermission = true;
        } catch {
          // User doesn't have manage permission — will fall back to creator-only check
        }

        const useCase = makeDeleteCalendarEventUseCase();
        await useCase.execute({ id, tenantId, userId, hasManagePermission });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CALENDAR.EVENT_DELETE,
          entityId: id,
          placeholders: { userName, eventTitle: existingEvent.title },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
