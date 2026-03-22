import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  activityResponseSchema,
  listActivitiesQuerySchema,
} from '@/http/schemas/sales/activities';
import type { Activity } from '@/entities/sales/activity';
import { makeListActivitiesUseCase } from '@/use-cases/sales/activities/factories/make-list-activities-use-case';
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

export async function listActivitiesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/activities',
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
      summary: 'List activities',
      querystring: listActivitiesQuerySchema,
      response: {
        200: z.object({
          activities: z.array(activityResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        page,
        limit,
        contactId,
        dealId,
        type,
        sortBy,
        sortOrder,
      } = request.query;

      const useCase = makeListActivitiesUseCase();
      const { activities, total, totalPages } = await useCase.execute({
        tenantId,
        page,
        limit,
        contactId,
        dealId,
        type,
        sortBy,
        sortOrder,
      });

      return reply.status(200).send({
        activities: activities.map(activityToDTO),
        meta: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    },
  });
}
