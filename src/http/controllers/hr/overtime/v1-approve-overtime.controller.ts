import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { approveOvertimeSchema, overtimeResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { overtimeToDTO } from '@/mappers/hr/overtime/overtime-to-dto';
import { makeApproveOvertimeUseCase } from '@/use-cases/hr/overtime/factories/make-approve-overtime-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function approveOvertimeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/overtime/:overtimeId/approve',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Overtime'],
      summary: 'Approve overtime',
      description: 'Approves an overtime request',
      params: z.object({
        overtimeId: idSchema,
      }),
      body: approveOvertimeSchema,
      response: {
        200: z.object({
          overtime: overtimeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { overtimeId } = request.params;
      const { addToTimeBank } = request.body;
      const approvedById = request.user.sub;

      try {
        const approveOvertimeUseCase = makeApproveOvertimeUseCase();
        const { overtime } = await approveOvertimeUseCase.execute({
          overtimeId,
          approvedBy: approvedById,
          addToTimeBank,
        });

        return reply.status(200).send({ overtime: overtimeToDTO(overtime) });
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
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
