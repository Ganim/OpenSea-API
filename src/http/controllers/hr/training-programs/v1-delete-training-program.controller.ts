import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { makeDeleteTrainingProgramUseCase } from '@/use-cases/hr/training-programs/factories/make-delete-training-program-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteTrainingProgramController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/training-programs/:trainingProgramId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TRAINING.REMOVE,
        resource: 'training-programs',
      }),
    ],
    schema: {
      tags: ['HR - Training'],
      summary: 'Delete training program',
      description: 'Deactivates a training program (soft delete)',
      params: z.object({ trainingProgramId: idSchema }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { trainingProgramId } = request.params;

      try {
        const useCase = makeDeleteTrainingProgramUseCase();
        const { trainingProgram } = await useCase.execute({
          tenantId,
          trainingProgramId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TRAINING_PROGRAM_DELETE,
          entityId: trainingProgramId,
          placeholders: {
            userName: request.user.sub,
            programName: trainingProgram.name,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
