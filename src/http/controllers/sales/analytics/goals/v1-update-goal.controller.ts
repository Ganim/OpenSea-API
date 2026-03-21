import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdateGoalUseCase } from '@/use-cases/sales/analytics/goals/factories/make-update-goal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateGoalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/analytics/goals/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ANALYTICS_GOALS.MODIFY,
        resource: 'analytics-goals',
      }),
    ],
    schema: {
      tags: ['Sales - Analytics Goals'],
      summary: 'Update an analytics goal',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(128).optional(),
        targetValue: z.number().positive().optional(),
        currentValue: z.number().min(0).optional(),
        unit: z.string().max(16).optional(),
        status: z.enum(['ACTIVE', 'ACHIEVED', 'MISSED', 'ARCHIVED']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
      response: {
        200: z.object({ goal: z.any() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateGoalUseCase();
        const result = await useCase.execute({ id, tenantId, ...data });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: 'Goal not found.' });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
