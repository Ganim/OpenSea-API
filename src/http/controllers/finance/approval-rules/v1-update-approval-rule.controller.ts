import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdateApprovalRuleUseCase } from '@/use-cases/finance/approval-rules/factories/make-update-approval-rule-use-case';
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

export async function updateApprovalRuleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/approval-rules/:id',
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
      summary: 'Update a finance auto-approval rule',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(128).optional(),
        isActive: z.boolean().optional(),
        action: z.enum(['AUTO_PAY', 'AUTO_APPROVE', 'FLAG_REVIEW']).optional(),
        maxAmount: z.number().positive().nullable().optional(),
        conditions: conditionsSchema,
        priority: z.number().int().min(0).optional(),
      }),
      response: {
        200: z.object({ rule: z.any() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const useCase = makeUpdateApprovalRuleUseCase();
        const result = await useCase.execute({
          id,
          tenantId,
          ...request.body,
        });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
