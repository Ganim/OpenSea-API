import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { dealResponseSchema } from '@/http/schemas/sales/deals';
import { makeGetDealByIdUseCase } from '@/use-cases/sales/deals/factories/make-get-deal-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getDealByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/deals/:dealId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.DEALS.ACCESS,
        resource: 'deals',
      }),
    ],
    schema: {
      tags: ['Sales - Deals'],
      summary: 'Get deal by ID',
      params: z.object({
        dealId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          deal: dealResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { dealId } = request.params as { dealId: string };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetDealByIdUseCase();
        const { deal } = await useCase.execute({ id: dealId, tenantId });

        return reply.status(200).send({
          deal: {
            id: deal.id.toString(),
            tenantId: deal.tenantId.toString(),
            title: deal.title,
            customerId: deal.customerId.toString(),
            pipelineId: deal.pipelineId.toString(),
            stageId: deal.stageId.toString(),
            value: deal.value ?? null,
            currency: deal.currency,
            expectedCloseDate: deal.expectedCloseDate ?? null,
            probability: deal.probability ?? null,
            status: deal.status,
            lostReason: deal.lostReason ?? null,
            wonAt: deal.wonAt ?? null,
            lostAt: deal.lostAt ?? null,
            closedAt: deal.closedAt ?? null,
            assignedToUserId: deal.assignedToUserId?.toString() ?? null,
            tags: deal.tags,
            customFields: deal.customFields ?? null,
            stageEnteredAt: deal.stageEnteredAt,
            previousDealId: deal.previousDealId?.toString() ?? null,
            createdAt: deal.createdAt,
            updatedAt: deal.updatedAt ?? null,
            deletedAt: deal.deletedAt ?? null,
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
