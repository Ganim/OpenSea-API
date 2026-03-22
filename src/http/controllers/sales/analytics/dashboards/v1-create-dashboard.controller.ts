import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateDashboardUseCase } from '@/use-cases/sales/analytics/dashboards/factories/make-create-dashboard-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createDashboardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/analytics/dashboards',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ANALYTICS_DASHBOARDS.REGISTER,
        resource: 'analytics-dashboards',
      }),
    ],
    schema: {
      tags: ['Sales - Analytics Dashboards'],
      summary: 'Create a new analytics dashboard',
      body: z.object({
        name: z.string().min(1).max(128),
        description: z.string().optional(),
        role: z
          .enum([
            'SELLER',
            'MANAGER',
            'DIRECTOR',
            'BID_SPECIALIST',
            'MARKETPLACE_OPS',
            'CASHIER',
          ])
          .optional(),
        visibility: z.enum(['PRIVATE', 'TEAM', 'TENANT']).optional(),
        layout: z.record(z.string(), z.unknown()).optional(),
      }),
      response: {
        201: z.object({ dashboard: z.any() }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const data = request.body;

      try {
        const useCase = makeCreateDashboardUseCase();
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
