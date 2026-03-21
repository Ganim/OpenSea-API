import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { comboResponseSchema, listCombosQuerySchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
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
      const { page, limit, search, type, isActive, sortBy, sortOrder } = request.query;

      const where = {
        tenantId,
        deletedAt: null,
        ...(search && {
          name: { contains: search, mode: 'insensitive' as const },
        }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      };

      const [combos, total] = await Promise.all([
        prisma.combo.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        }),
        prisma.combo.count({ where }),
      ]);

      return reply.status(200).send({
        combos: combos.map((c) => ({
          ...c,
          fixedPrice: c.fixedPrice ? Number(c.fixedPrice) : null,
          discountValue: c.discountValue ? Number(c.discountValue) : null,
          description: c.description ?? null,
          discountType: c.discountType ?? null,
          minItems: c.minItems ?? null,
          maxItems: c.maxItems ?? null,
          validFrom: c.validFrom ?? null,
          validUntil: c.validUntil ?? null,
          imageUrl: c.imageUrl ?? null,
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
