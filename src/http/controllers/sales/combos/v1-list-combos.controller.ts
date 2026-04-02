import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema, listCombosQuerySchema } from '@/http/schemas';
import { makeListCombosUseCase } from '@/use-cases/sales/combos/factories/make-list-combos-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCombosController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/combos',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COMBOS.ACCESS,
        resource: 'combos',
      }),
    ],
    schema: {
      tags: ['Sales - Combos'],
      summary: 'List all combos',
      querystring: listCombosQuerySchema,
      response: {
        200: z.object({
          combos: z.array(comboResponseSchema),
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
        type,
        isActive,
        sortBy: _sortBy,
        sortOrder: _sortOrder,
      } = request.query;

      const useCase = makeListCombosUseCase();
      const { combos } = await useCase.execute({
        tenantId,
        page,
        limit,
        search,
        type,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });

      return reply.status(200).send({
        combos: combos.data.map((c) => ({
          id: c.comboId.toString(),
          tenantId: c.tenantId.toString(),
          name: c.name,
          description: c.description ?? null,
          type: c.type,
          discountType: c.discountType ?? null,
          discountValue: c.discountValue ? Number(c.discountValue) : null,
          fixedPrice: null,
          isActive: c.isActive,
          minItems: c.minItems ?? null,
          maxItems: c.maxItems ?? null,
          validFrom: c.startDate ?? null,
          validUntil: c.endDate ?? null,
          imageUrl: null,
          deletedAt: c.deletedAt ?? null,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        meta: {
          total: combos.total,
          page: combos.page,
          limit: combos.limit,
          pages: combos.totalPages,
        },
      });
    },
  });
}
