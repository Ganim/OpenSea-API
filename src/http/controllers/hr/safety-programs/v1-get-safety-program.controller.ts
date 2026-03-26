import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { safetyProgramResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { safetyProgramToDTO } from '@/mappers/hr/safety-program';
import { makeGetSafetyProgramUseCase } from '@/use-cases/hr/safety-programs/factories/make-get-safety-program-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetSafetyProgramController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/safety-programs/:programId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Safety Programs'],
      summary: 'Get safety program',
      description: 'Gets a safety program by ID',
      params: z.object({
        programId: idSchema,
      }),
      response: {
        200: z.object({
          safetyProgram: safetyProgramResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { programId } = request.params;

      try {
        const useCase = makeGetSafetyProgramUseCase();
        const { safetyProgram } = await useCase.execute({
          tenantId,
          programId,
        });

        return reply
          .status(200)
          .send({ safetyProgram: safetyProgramToDTO(safetyProgram) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
