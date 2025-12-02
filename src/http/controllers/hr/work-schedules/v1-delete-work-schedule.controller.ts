import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { idSchema } from '@/http/schemas/common.schema';
import { makeDeleteWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-delete-work-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteWorkScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/work-schedules/:workScheduleId',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'Delete a work schedule',
      description: 'Soft deletes a work schedule',
      params: z.object({
        workScheduleId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { workScheduleId } = request.params;

      try {
        const deleteWorkScheduleUseCase = makeDeleteWorkScheduleUseCase();
        await deleteWorkScheduleUseCase.execute({ id: workScheduleId });

        return reply.status(204).send();
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
