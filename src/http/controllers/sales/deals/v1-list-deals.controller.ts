import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  dealResponseSchema,
  listDealsQuerySchema,
} from '@/http/schemas/sales/deals';
import { makeListDealsUseCase } from '@/use-cases/sales/deals/factories/make-list-deals-use-case';
import type { Deal } from '@/entities/sales/deal';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

function dealToDTO(deal: Deal) {
  return {
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
  };
}

export async function listDealsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/deals',
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
      summary: 'List all deals',
      querystring: listDealsQuerySchema,
      response: {
        200: z.object({
          deals: z.array(dealResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        page,
        limit,
        search,
        customerId,
        pipelineId,
        stageId,
        status,
        assignedToUserId,
        sortBy,
        sortOrder,
      } = request.query;

      const useCase = makeListDealsUseCase();
      const { deals, total, totalPages } = await useCase.execute({
        tenantId,
        page,
        limit,
        search,
        customerId,
        pipelineId,
        stageId,
        status,
        assignedToUserId,
        sortBy,
        sortOrder,
      });

      return reply.status(200).send({
        deals: deals.map(dealToDTO),
        meta: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      });
    },
  });
}
