import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { workScheduleResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { workScheduleToDTO } from '@/mappers/hr/work-schedule/work-schedule-to-dto';
import { makeGetWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-get-work-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getWorkScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/work-schedules/:workScheduleId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'Get a work schedule',
      description: 'Retrieves a work schedule by ID',
      params: z.object({
        workScheduleId: idSchema,
      }),
      response: {
        200: z.object({
          workSchedule: workScheduleResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { workScheduleId } = request.params;

      try {
        const getWorkScheduleUseCase = makeGetWorkScheduleUseCase();
        const { workSchedule } = await getWorkScheduleUseCase.execute({
          id: workScheduleId,
        });

        return reply
          .status(200)
          .send({ workSchedule: workScheduleToDTO(workSchedule) });
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
