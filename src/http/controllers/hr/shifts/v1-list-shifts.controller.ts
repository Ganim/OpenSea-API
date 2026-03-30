import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listShiftsQuerySchema, shiftResponseSchema } from '@/http/schemas';
import { shiftToDTO } from '@/mappers/hr/shift/shift-to-dto';
import { makeListShiftsUseCase } from '@/use-cases/hr/shifts/factories/make-list-shifts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListShiftsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/shifts',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Shifts'],
      summary: 'List shifts',
      description: 'Lists all work shifts with optional filters',
      querystring: listShiftsQuerySchema,
      response: {
        200: z.object({
          shifts: z.array(shiftResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const listShiftsUseCase = makeListShiftsUseCase();
      const { shifts } = await listShiftsUseCase.execute({
        tenantId,
        activeOnly: query.activeOnly,
      });

      return reply.status(200).send({
        shifts: shifts.map(shiftToDTO),
      });
    },
  });
}
