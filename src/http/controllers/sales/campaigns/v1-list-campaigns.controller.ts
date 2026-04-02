import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  campaignResponseSchema,
  listCampaignsQuerySchema,
} from '@/http/schemas';
import type { Campaign } from '@/entities/sales/campaign';
import { makeListCampaignsUseCase } from '@/use-cases/sales/campaigns/factories/make-list-campaigns-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCampaignsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/campaigns',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CAMPAIGNS.ACCESS,
        resource: 'campaigns',
      }),
    ],
    schema: {
      tags: ['Sales - Campaigns'],
      summary: 'List all campaigns',
      querystring: listCampaignsQuerySchema,
      response: {
        200: z.object({
          campaigns: z.array(campaignResponseSchema),
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
        type: _type,
        status,
        sortBy: _sortBy,
        sortOrder: _sortOrder,
      } = request.query;

      const useCase = makeListCampaignsUseCase();
      const { campaigns } = await useCase.execute({
        tenantId,
        page,
        limit,
        status: status as Campaign['status'] | undefined,
        search,
      });

      return reply.status(200).send({
        campaigns: campaigns.data.map((c) => ({
          id: c.campaignId.toString(),
          tenantId: c.tenantId.toString(),
          name: c.name,
          description: c.description ?? null,
          type: c.type,
          status: c.status,
          startDate: c.startDate ?? null,
          endDate: c.endDate ?? null,
          maxUsageTotal: c.maxUsageTotal ?? null,
          maxUsagePerCustomer: c.maxUsagePerCustomer ?? null,
          priority: c.priority,
          stackable: c.isStackable,
          usageCount: c.currentUsageTotal,
          targetAudience: null,
          channels: [] as string[],
          aiGenerated: false,
          aiReason: null,
          createdByUserId: '00000000-0000-0000-0000-000000000000',
          deletedAt: c.deletedAt ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        meta: {
          total: campaigns.total,
          page: campaigns.page,
          limit: campaigns.limit,
          pages: campaigns.totalPages,
        },
      });
    },
  });
}
