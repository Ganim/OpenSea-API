import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  activityResponseSchema,
  updateActivitySchema,
} from '@/http/schemas/sales/activities';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateActivityUseCase } from '@/use-cases/sales/activities/factories/make-update-activity-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateActivityController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/activities/:activityId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ACTIVITIES.REGISTER,
        resource: 'activities',
      }),
    ],
    schema: {
      tags: ['Sales - Activities'],
      summary: 'Update an activity',
      params: z.object({
        activityId: z.string().uuid(),
      }),
      body: updateActivitySchema,
      response: {
        200: z.object({
          activity: activityResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { activityId } = request.params as { activityId: string };
      const body = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateActivityUseCase();
        const { activity } = await useCase.execute({
          id: activityId,
          tenantId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.ACTIVITY_UPDATE,
          entityId: activityId,
          placeholders: { userName, activityTitle: activity.title },
          newData: body,
        });

        return reply.status(200).send({
          activity: {
            id: activity.id.toString(),
            tenantId: activity.tenantId.toString(),
            type: activity.type,
            title: activity.title,
            description: activity.description ?? null,
            contactId: activity.contactId?.toString() ?? null,
            customerId: activity.customerId?.toString() ?? null,
            dealId: activity.dealId?.toString() ?? null,
            performedByUserId: activity.performedByUserId?.toString() ?? null,
            performedAt: activity.performedAt,
            dueAt: activity.dueAt ?? null,
            completedAt: activity.completedAt ?? null,
            duration: activity.duration ?? null,
            outcome: activity.outcome ?? null,
            metadata: activity.metadata ?? null,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt ?? null,
            deletedAt: activity.deletedAt ?? null,
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
