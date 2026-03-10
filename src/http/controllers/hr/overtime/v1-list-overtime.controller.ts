import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listOvertimeQuerySchema,
  overtimeResponseSchema,
} from '@/http/schemas';
import { overtimeToDTO } from '@/mappers/hr/overtime/overtime-to-dto';
import { makeListOvertimeUseCase } from '@/use-cases/hr/overtime/factories/make-list-overtime-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listOvertimeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/overtime',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Overtime'],
      summary: 'List overtime requests',
      description: 'Lists overtime requests with optional filters',
      querystring: listOvertimeQuerySchema,
      response: {
        200: z.object({
          overtime: z.array(overtimeResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const listOvertimeUseCase = makeListOvertimeUseCase();
      const { overtimes, meta } = await listOvertimeUseCase.execute({
        ...query,
        tenantId,
      });

      return reply.status(200).send({
        overtime: overtimes.map(overtimeToDTO),
        total: meta.total,
        page: meta.page,
        perPage: meta.perPage,
        totalPages: meta.totalPages,
      });
    },
  });
}
