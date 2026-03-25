import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { activityResponseSchema } from '@/http/schemas/sales/activities';
import type { Activity } from '@/entities/sales/activity';
import { makeGetActivityByIdUseCase } from '@/use-cases/sales/activities/factories/make-get-activity-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

function activityToDTO(activity: Activity) {
  return {
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
  };
}

export async function getActivityByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/activities/:activityId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ACTIVITIES.ACCESS,
        resource: 'activities',
      }),
    ],
    schema: {
      tags: ['Sales - Activities'],
      summary: 'Get an activity by ID',
      params: z.object({
        activityId: z.string().uuid().describe('Activity UUID'),
      }),
      response: {
        200: z.object({ activity: activityResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { activityId } = request.params;

      try {
        const useCase = makeGetActivityByIdUseCase();
        const { activity } = await useCase.execute({
          id: activityId,
          tenantId,
        });

        return reply.status(200).send({ activity: activityToDTO(activity) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
