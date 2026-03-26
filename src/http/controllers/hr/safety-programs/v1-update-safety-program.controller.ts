import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateSafetyProgramSchema,
  safetyProgramResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { safetyProgramToDTO } from '@/mappers/hr/safety-program';
import { makeUpdateSafetyProgramUseCase } from '@/use-cases/hr/safety-programs/factories/make-update-safety-program-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateSafetyProgramController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/safety-programs/:programId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SAFETY.MODIFY,
        resource: 'safety-programs',
      }),
    ],
    schema: {
      tags: ['HR - Safety Programs'],
      summary: 'Update safety program',
      description: 'Updates an existing safety program',
      params: z.object({
        programId: idSchema,
      }),
      body: updateSafetyProgramSchema,
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
      const data = request.body;

      try {
        const useCase = makeUpdateSafetyProgramUseCase();
        const { safetyProgram } = await useCase.execute({
          tenantId,
          programId,
          ...data,
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
