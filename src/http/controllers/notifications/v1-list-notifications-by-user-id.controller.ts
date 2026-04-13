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
      tags: ['Sales - Notifications'],
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
        page,
        limit,
      });

      // Post-filter: remove notifications from modules the user lacks permission for
      const permissionService = getPermissionService();
      const userId = new UniqueEntityID(request.user.sub);

      // Collect unique entity types that need permission checks
      const entityTypesToCheck = new Set<string>();
      for (const notification of data) {
        const entityType = notification.entityType;
        if (entityType && entityType in ENTITY_TYPE_PERMISSION_MAP) {
          entityTypesToCheck.add(entityType);
        }
      }

      // Batch-check permissions (one check per entity type, not per notification)
      const deniedEntityTypes = new Set<string>();
      for (const entityType of entityTypesToCheck) {
        const requiredPermission = ENTITY_TYPE_PERMISSION_MAP[entityType];
        const allowed = await permissionService.hasPermission(
          userId,
          requiredPermission,
        );
        if (!allowed) {
          deniedEntityTypes.add(entityType);
        }
      }

      // Filter out denied notifications
      const filtered =
        deniedEntityTypes.size > 0
          ? data.filter(
              (n) => !n.entityType || !deniedEntityTypes.has(n.entityType),
            )
          : data;

      const filteredTotal =
        deniedEntityTypes.size > 0 ? total - (data.length - filtered.length) : total;
      const totalPages = Math.ceil(filteredTotal / (limit || 20));

      return reply.status(200).send({
        notifications: NotificationPresenter.toHTTPMany(filtered),
        total: Math.max(0, filteredTotal),
        totalPages,
      });
    },
  });
}
