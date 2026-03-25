import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListOverdueEscalationsUseCase } from '@/use-cases/finance/escalations/factories/make-list-overdue-escalations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listOverdueEscalationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/escalations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Escalations'],
      summary: 'List overdue escalation templates',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        isActive: z
          .enum(['true', 'false'])
          .transform((v) => v === 'true')
          .optional(),
      }),
      response: {
        200: z.object({
          data: z.array(z.any()),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, isActive } = request.query;

      const useCase = makeListOverdueEscalationsUseCase();
      const { escalations, total } = await useCase.execute({
        tenantId,
        page,
        limit,
        isActive,
      });

      return reply.status(200).send({
        data: escalations,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });
}
