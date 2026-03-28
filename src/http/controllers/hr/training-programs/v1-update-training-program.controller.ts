import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  trainingProgramResponseSchema,
  updateTrainingProgramSchema,
} from '@/http/schemas/hr/training';
import { idSchema } from '@/http/schemas/common.schema';
import { trainingProgramToDTO } from '@/mappers/hr/training-program';
import { makeUpdateTrainingProgramUseCase } from '@/use-cases/hr/training-programs/factories/make-update-training-program-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateTrainingProgramController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/training-programs/:trainingProgramId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TRAINING.MODIFY,
        resource: 'training-programs',
      }),
    ],
    schema: {
      tags: ['HR - Training'],
      summary: 'Update training program',
      description: 'Updates an existing training program',
      params: z.object({ trainingProgramId: idSchema }),
      body: updateTrainingProgramSchema,
      response: {
        200: z.object({ trainingProgram: trainingProgramResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { trainingProgramId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateTrainingProgramUseCase();
        const { trainingProgram } = await useCase.execute({
          tenantId,
          trainingProgramId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TRAINING_PROGRAM_UPDATE,
          entityId: trainingProgram.id.toString(),
          placeholders: {
            userName: request.user.sub,
            programName: trainingProgram.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(200)
          .send({ trainingProgram: trainingProgramToDTO(trainingProgram) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
