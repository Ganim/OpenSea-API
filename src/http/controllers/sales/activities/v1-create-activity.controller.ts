import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  activityResponseSchema,
  createActivitySchema,
} from '@/http/schemas/sales/activities';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateActivityUseCase } from '@/use-cases/sales/activities/factories/make-create-activity-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createActivityController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/activities',
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
      summary: 'Create a new activity',
      body: createActivitySchema,
      response: {
        201: z.object({
          activity: activityResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateActivityUseCase();
        const { activity } = await useCase.execute({
          tenantId,
          userId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.ACTIVITY_CREATE,
          entityId: activity.id.toString(),
          placeholders: {
            userName,
            activityTitle: activity.title,
            activityType: activity.type,
          },
          newData: {
            title: data.title,
            type: data.type,
            contactId: data.contactId,
            customerId: data.customerId,
            dealId: data.dealId,
          },
        });

        return reply.status(201).send({
          activity: {
            id: activity.id.toString(),
            tenantId: activity.tenantId.toString(),
            type: activity.type,
            title: activity.title,
            description: activity.description ?? null,
            contactId: activity.contactId?.toString() ?? null,
            dealId: activity.dealId?.toString() ?? null,
            userId: activity.userId.toString(),
            status: activity.status,
            dueDate: activity.dueDate ?? null,
            completedAt: activity.completedAt ?? null,
            duration: activity.duration ?? null,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt ?? null,
            deletedAt: activity.deletedAt ?? null,
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
