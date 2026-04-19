import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { NotificationPresenter } from '@/http/presenters/notifications/notification-presenter';
import {
  listNotificationsQuerySchema,
  notificationResponseSchema,
} from '@/http/schemas';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeListNotificationsByUserIdUseCase } from '@/use-cases/notifications/factories/make-list-notifications-by-user-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Maps notification entityType → permission code required to view it.
 * Notifications whose entityType is NOT listed here are always visible.
 */
const ENTITY_TYPE_PERMISSION_MAP: Record<string, string> = {
  finance_entry: PermissionCodes.FINANCE.ENTRIES.ACCESS,
};

export async function listNotificationsByUserIdController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/notifications',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications'],
      summary: 'List notifications by userId (authenticated user)',
      querystring: listNotificationsQuerySchema,
      response: {
        200: z.object({
          notifications: z.array(notificationResponseSchema),
          total: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        isRead,
        type,
        channel,
        priority,
        startDate,
        endDate,
        page,
        limit,
      } = request.query;

      // Determine which entity types to exclude based on user permissions
      const permissionService = getPermissionService();
      const userId = new UniqueEntityID(request.user.sub);

      const excludeEntityTypes: string[] = [];
      for (const [entityType, permissionCode] of Object.entries(
        ENTITY_TYPE_PERMISSION_MAP,
      )) {
        const allowed = await permissionService.hasPermission(
          userId,
          permissionCode,
        );
        if (!allowed) {
          excludeEntityTypes.push(entityType);
        }
      }

      const listNotificationsByUserIdUseCase =
        makeListNotificationsByUserIdUseCase();
      const { data, total } = await listNotificationsByUserIdUseCase.execute({
        userId: request.user.sub,
        isRead,
        type,
        channel,
        priority,
        startDate,
        endDate,
        excludeEntityTypes:
          excludeEntityTypes.length > 0 ? excludeEntityTypes : undefined,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / (limit || 20));

      return reply.status(200).send({
        notifications: NotificationPresenter.toHTTPMany(data),
        total,
        totalPages,
      });
    },
  });
}
