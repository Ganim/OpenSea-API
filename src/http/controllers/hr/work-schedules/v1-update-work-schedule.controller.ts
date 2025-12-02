import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  updateWorkScheduleSchema,
  workScheduleResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { workScheduleToDTO } from '@/mappers/hr/work-schedule/work-schedule-to-dto';
import { makeUpdateWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-update-work-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateWorkScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/work-schedules/:workScheduleId',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'Update a work schedule',
      description: 'Updates an existing work schedule',
      params: z.object({
        workScheduleId: idSchema,
      }),
      body: updateWorkScheduleSchema,
      response: {
        200: z.object({
          workSchedule: workScheduleResponseSchema,
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
      const { workScheduleId } = request.params;
      const data = request.body;

      try {
        const updateWorkScheduleUseCase = makeUpdateWorkScheduleUseCase();
        const { workSchedule } = await updateWorkScheduleUseCase.execute({
          id: workScheduleId,
          ...data,
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
