import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListCommissionsUseCase } from '@/use-cases/sales/commissions/factories/make-list-commissions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCommissionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/commissions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COMMISSIONS.ACCESS,
        resource: 'commissions',
      }),
    ],
    schema: {
      tags: ['Sales - Commissions'],
      summary: 'List order commissions',
      querystring: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        status: z.string().optional(),
        userId: z.string().optional(),
      }),
      response: {
        200: z.object({
          commissions: z.array(
            z.object({
              id: z.string(),
              tenantId: z.string(),
              orderId: z.string(),
              userId: z.string(),
              baseValue: z.number(),
              commissionType: z.string(),
              commissionRate: z.number(),
              commissionValue: z.number(),
              status: z.string(),
              paidAt: z.string().nullable(),
              financeEntryId: z.string().nullable(),
              createdAt: z.string(),
              updatedAt: z.string(),
            }),
          ),
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
      const { page, limit, status, userId } = request.query;

      const useCase = makeListCommissionsUseCase();
      const { commissions } = await useCase.execute({
        tenantId,
        page,
        limit,
        status,
        userId,
      });

      return reply.status(200).send({
        commissions: commissions.data.map((commission) => ({
          id: commission.id,
          tenantId: commission.tenantId,
          orderId: commission.orderId,
          userId: commission.userId,
          baseValue: commission.baseValue,
          commissionType: commission.commissionType,
          commissionRate: commission.commissionRate,
          commissionValue: commission.commissionValue,
          status: commission.status,
          paidAt: commission.paidAt?.toISOString() ?? null,
          financeEntryId: commission.financeEntryId,
          createdAt: commission.createdAt.toISOString(),
          updatedAt: commission.updatedAt.toISOString(),
        })),
        meta: {
          total: commissions.total,
          page: commissions.page,
          limit: commissions.limit,
          pages: commissions.totalPages,
        },
      });
    },
  });
}
