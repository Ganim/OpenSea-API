import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetGoalProgressUseCase } from '@/use-cases/sales/analytics/goals/factories/make-get-goal-progress-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getGoalProgressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/analytics/goals/:id/progress',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Analytics Goals'],
      summary: 'Get goal progress details',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          goal: z.any(),
          daysRemaining: z.number(),
          daysElapsed: z.number(),
          totalDays: z.number(),
          onTrack: z.boolean(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeGetGoalProgressUseCase();
        const result = await useCase.execute({ id, tenantId });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: 'Goal not found.' });
        }
        throw error;
      }
    },
  });
}
