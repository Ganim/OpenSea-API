import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { trainingProgramResponseSchema } from '@/http/schemas/hr/training';
import { idSchema } from '@/http/schemas/common.schema';
import { trainingProgramToDTO } from '@/mappers/hr/training-program';
import { makeGetTrainingProgramUseCase } from '@/use-cases/hr/training-programs/factories/make-get-training-program-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetTrainingProgramController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/training-programs/:trainingProgramId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Training'],
      summary: 'Get training program',
      description: 'Gets a training program by ID',
      params: z.object({ trainingProgramId: idSchema }),
      response: {
        200: z.object({ trainingProgram: trainingProgramResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { trainingProgramId } = request.params;

      try {
        const useCase = makeGetTrainingProgramUseCase();
        const { trainingProgram } = await useCase.execute({
          tenantId,
          trainingProgramId,
        });

        return reply
          .status(200)
          .send({ trainingProgram: trainingProgramToDTO(trainingProgram) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
