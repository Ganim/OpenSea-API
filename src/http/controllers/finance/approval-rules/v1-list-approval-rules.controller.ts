import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListApprovalRulesUseCase } from '@/use-cases/finance/approval-rules/factories/make-list-approval-rules-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listApprovalRulesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/approval-rules',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Approval Rules'],
      summary: 'List finance auto-approval rules',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(20),
        isActive: z.enum(['true', 'false']).optional().transform((v) =>
          v === undefined ? undefined : v === 'true'
        ),
        action: z.enum(['AUTO_PAY', 'AUTO_APPROVE', 'FLAG_REVIEW']).optional(),
      }),
      response: {
        200: z.object({
          rules: z.array(z.any()),
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
      const { page, limit, isActive, action } = request.query;

      const useCase = makeListApprovalRulesUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        isActive,
        action,
      });

      return reply.status(200).send(result);
    },
  });
}
