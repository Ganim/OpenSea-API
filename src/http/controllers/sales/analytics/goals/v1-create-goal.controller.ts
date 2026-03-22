import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateGoalUseCase } from '@/use-cases/sales/analytics/goals/factories/make-create-goal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createGoalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/analytics/goals',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ANALYTICS_GOALS.REGISTER,
        resource: 'analytics-goals',
      }),
    ],
    schema: {
      tags: ['Sales - Analytics Goals'],
      summary: 'Create a new analytics goal',
      body: z.object({
        name: z.string().min(1).max(128),
        type: z.enum([
          'REVENUE',
          'QUANTITY',
          'DEALS_WON',
          'NEW_CUSTOMERS',
          'TICKET_AVERAGE',
          'CONVERSION_RATE',
          'COMMISSION',
          'BID_WIN_RATE',
          'CUSTOM',
        ]),
        targetValue: z.number().positive(),
        unit: z.string().max(16).optional(),
        period: z.enum([
          'DAILY',
          'WEEKLY',
          'MONTHLY',
          'QUARTERLY',
          'YEARLY',
          'CUSTOM',
        ]),
        startDate: z.string(),
        endDate: z.string(),
        scope: z.enum(['INDIVIDUAL', 'TEAM', 'TENANT']),
        userId: z.string().uuid().optional(),
        teamId: z.string().uuid().optional(),
      }),
      response: {
        201: z.object({
          goal: z.any(),
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const data = request.body;

      try {
        const useCase = makeCreateGoalUseCase();
        const result = await useCase.execute({
          tenantId,
          ...data,
          createdByUserId: userId,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
