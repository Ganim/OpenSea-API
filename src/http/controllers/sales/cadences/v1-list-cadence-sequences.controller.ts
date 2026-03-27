import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cadenceSequenceResponseSchema } from '@/http/schemas/sales/cadences/cadence.schema';
import { makeListCadenceSequencesUseCase } from '@/use-cases/sales/cadence-sequences/factories/make-list-cadence-sequences-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCadenceSequencesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/cadences',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CADENCES.ACCESS,
        resource: 'cadences',
      }),
    ],
    schema: {
      tags: ['Sales - Cadences'],
      summary: 'List cadence sequences',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        isActive: z
          .enum(['true', 'false'])
          .transform((val) => val === 'true')
          .optional(),
        search: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(cadenceSequenceResponseSchema),
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
      const { page, limit, isActive, search } = request.query;

      const useCase = makeListCadenceSequencesUseCase();
      const { cadenceSequences, total } = await useCase.execute({
        tenantId,
        page,
        perPage: limit,
        isActive,
        search,
      });

      return reply.status(200).send({
        data: cadenceSequences,
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
