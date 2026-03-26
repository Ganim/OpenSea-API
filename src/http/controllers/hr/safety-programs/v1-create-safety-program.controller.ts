import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createSafetyProgramSchema,
  safetyProgramResponseSchema,
} from '@/http/schemas';
import { safetyProgramToDTO } from '@/mappers/hr/safety-program';
import { makeCreateSafetyProgramUseCase } from '@/use-cases/hr/safety-programs/factories/make-create-safety-program-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateSafetyProgramController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/safety-programs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SAFETY.REGISTER,
        resource: 'safety-programs',
      }),
    ],
    schema: {
      tags: ['HR - Safety Programs'],
      summary: 'Create safety program',
      description: 'Creates a new safety program (PCMSO, PGR, LTCAT, PPRA)',
      body: createSafetyProgramSchema,
      response: {
        201: z.object({
          safetyProgram: safetyProgramResponseSchema,
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
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateSafetyProgramUseCase();
        const { safetyProgram } = await useCase.execute({
          tenantId,
          ...data,
        });

        return reply
          .status(201)
          .send({ safetyProgram: safetyProgramToDTO(safetyProgram) });
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
