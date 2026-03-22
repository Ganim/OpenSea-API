import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  campaignResponseSchema,
  listCampaignsQuerySchema,
} from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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
      const { page, limit, search, type, status, sortBy, sortOrder } =
        request.query;

      const where = {
        tenantId,
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: 'insensitive' as const },
        }),
        ...(type && { type }),
        ...(status && { status }),
      };

      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        }),
        prisma.campaign.count({ where }),
      ]);

      return reply.status(200).send({
        campaigns: campaigns.map((c) => ({
          ...c,
          targetAudience: (c.targetAudience as Record<string, unknown>) ?? null,
          description: c.description ?? null,
          maxUsageTotal: c.maxUsageTotal ?? null,
          maxUsagePerCustomer: c.maxUsagePerCustomer ?? null,
          aiReason: c.aiReason ?? null,
          deletedAt: c.deletedAt ?? null,
        })),
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
