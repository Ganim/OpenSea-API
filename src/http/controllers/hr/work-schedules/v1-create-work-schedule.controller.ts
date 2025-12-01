import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  createWorkScheduleSchema,
  workScheduleResponseSchema,
} from '@/http/schemas';
import { workScheduleToDTO } from '@/mappers/hr/work-schedule/work-schedule-to-dto';
import { makeCreateWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-create-work-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createWorkScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/work-schedules',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'Create a work schedule',
      description: 'Creates a new work schedule template',
      body: createWorkScheduleSchema,
      response: {
        201: z.object({
          workSchedule: workScheduleResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;

      try {
        const createWorkScheduleUseCase = makeCreateWorkScheduleUseCase();
        const { workSchedule } = await createWorkScheduleUseCase.execute(data);

        return reply
          .status(201)
          .send({ workSchedule: workScheduleToDTO(workSchedule) });
      } catch (error) {
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
