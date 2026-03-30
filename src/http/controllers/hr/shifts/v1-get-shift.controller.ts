import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema, shiftResponseSchema } from '@/http/schemas';
import { shiftToDTO } from '@/mappers/hr/shift/shift-to-dto';
import { makeGetShiftUseCase } from '@/use-cases/hr/shifts/factories/make-get-shift-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetShiftController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/shifts/:shiftId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Shifts'],
      summary: 'Get a shift',
      description: 'Retrieves a shift by ID with assignment count',
      params: z.object({
        shiftId: idSchema,
      }),
      response: {
        200: z.object({
          shift: shiftResponseSchema,
          assignmentCount: z.number(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { shiftId } = request.params;

      try {
        const getShiftUseCase = makeGetShiftUseCase();
        const { shift, assignmentCount } = await getShiftUseCase.execute({
          shiftId,
          tenantId,
        });

        return reply.status(200).send({
          shift: shiftToDTO(shift),
          assignmentCount,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
