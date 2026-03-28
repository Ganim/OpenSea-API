import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTrainingProgramSchema,
  trainingProgramResponseSchema,
} from '@/http/schemas/hr/training';
import { trainingProgramToDTO } from '@/mappers/hr/training-program';
import { makeCreateTrainingProgramUseCase } from '@/use-cases/hr/training-programs/factories/make-create-training-program-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateTrainingProgramController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/training-programs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TRAINING.REGISTER,
        resource: 'training-programs',
      }),
    ],
    schema: {
      tags: ['HR - Training'],
      summary: 'Create training program',
      description: 'Creates a new training program',
      body: createTrainingProgramSchema,
      response: {
        201: z.object({ trainingProgram: trainingProgramResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateTrainingProgramUseCase();
        const { trainingProgram } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TRAINING_PROGRAM_CREATE,
          entityId: trainingProgram.id.toString(),
          placeholders: {
            userName: request.user.sub,
            programName: trainingProgram.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ trainingProgram: trainingProgramToDTO(trainingProgram) });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
