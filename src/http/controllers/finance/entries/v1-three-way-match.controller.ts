import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeThreeWayMatchUseCase } from '@/use-cases/finance/matching/factories/make-three-way-match-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function threeWayMatchController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/:id/three-way-match',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Run three-way matching for a payable entry',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          entryId: z.string(),
          matchStatus: z.enum(['FULL_MATCH', 'PARTIAL_MATCH', 'NO_MATCH']),
          invoice: z
            .object({
              id: z.string(),
              number: z.string(),
              amount: z.number(),
              date: z.string(),
            })
            .optional(),
          purchaseOrder: z
            .object({
              id: z.string(),
              code: z.string(),
              amount: z.number(),
              date: z.string(),
            })
            .optional(),
          goodsReceipt: z
            .object({
              id: z.string(),
              code: z.string(),
              items: z.number(),
              date: z.string(),
            })
            .optional(),
          discrepancies: z.array(
            z.object({
              field: z.string(),
              expected: z.string(),
              actual: z.string(),
              tolerance: z.string(),
            }),
          ),
          recommendation: z.string(),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeThreeWayMatchUseCase();
        const result = await useCase.execute({ tenantId, entryId: id });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
