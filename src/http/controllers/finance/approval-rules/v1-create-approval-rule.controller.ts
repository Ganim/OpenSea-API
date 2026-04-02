import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreateApprovalRuleUseCase } from '@/use-cases/finance/approval-rules/factories/make-create-approval-rule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const conditionsSchema = z
  .object({
    categoryIds: z.array(z.string().uuid()).optional(),
    supplierNames: z.array(z.string()).optional(),
    entryType: z.enum(['PAYABLE', 'RECEIVABLE']).optional(),
    minRecurrence: z.number().int().min(1).optional(),
  })
  .optional();

export async function createApprovalRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
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
      summary: 'Create a finance auto-approval rule',
      security: [{ bearerAuth: [] }],
      body: z.object({
        name: z.string().min(1).max(128),
        isActive: z.boolean().optional(),
        action: z.enum(['AUTO_PAY', 'AUTO_APPROVE', 'FLAG_REVIEW']),
        maxAmount: z.number().positive().optional(),
        conditions: conditionsSchema,
        priority: z.number().int().min(0).optional(),
      }),
      response: {
        201: z.object({ rule: z.any() }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeCreateApprovalRuleUseCase();
        const result = await useCase.execute({
          tenantId,
          ...request.body,
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
