import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeEvaluateAutoApprovalUseCase } from '@/use-cases/finance/approval-rules/factories/make-evaluate-auto-approval-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function evaluateApprovalRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/approval-rules/evaluate/:entryId',
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
      summary: 'Manually trigger auto-approval evaluation for a finance entry',
      security: [{ bearerAuth: [] }],
      params: z.object({ entryId: z.string().uuid() }),
      response: {
        200: z.object({
          matched: z.boolean(),
          rule: z.any().optional(),
          action: z.string().optional(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { entryId } = request.params as { entryId: string };

      const useCase = makeEvaluateAutoApprovalUseCase();
      const result = await useCase.execute({
        entryId,
        tenantId,
        createdBy: userId,
      });

      return reply.status(200).send(result);
    },
  });
}
