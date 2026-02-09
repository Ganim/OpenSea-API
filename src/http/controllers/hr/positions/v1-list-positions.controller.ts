import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPositionsQuerySchema,
  positionResponseSchema,
} from '@/http/schemas/hr.schema';
import { prisma } from '@/lib/prisma';
import { positionToDTO } from '@/mappers/hr/position';
import { makeListPositionsUseCase } from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const listResponseSchema = z.object({
  positions: z.array(positionResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

export async function listPositionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/positions',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Positions'],
      summary: 'List positions with pagination',
      description: 'Retrieves a paginated list of positions',
      querystring: listPositionsQuerySchema,
      response: {
        200: listResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const {
        page,
        perPage,
        search,
        departmentId,
        companyId,
        level,
        isActive,
      } = request.query;

      const listPositionsUseCase = makeListPositionsUseCase();
      const result = await listPositionsUseCase.execute({
        tenantId,
        page,
        perPage,
        search,
        departmentId,
        companyId,
        level,
        isActive,
      });

      // Fetch _count for employees per position
      const ids = result.positions.map((p) => p.id.toString());
      const countsData = ids.length > 0
        ? await prisma.position.findMany({
            where: { id: { in: ids } },
            select: {
              id: true,
              _count: { select: { employees: true } },
            },
          })
        : [];
      const countMap = new Map(countsData.map((p) => [p.id, p._count]));

      return reply.status(200).send({
        positions: result.positions.map((p) => ({
          ...positionToDTO(p),
          _count: countMap.get(p.id.toString()) ?? { employees: 0 },
        })),
        meta: result.meta,
      });
    },
  });
}
