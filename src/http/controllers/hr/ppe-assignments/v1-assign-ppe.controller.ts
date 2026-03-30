import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  assignPPESchema,
  ppeAssignmentResponseSchema,
} from '@/http/schemas/hr/safety';
import { ppeAssignmentToDTO } from '@/mappers/hr/ppe-assignment';
import { makeAssignPPEUseCase } from '@/use-cases/hr/ppe-assignments/factories/make-assign-ppe-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AssignPPEController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/ppe-assignments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PPE.REGISTER,
        resource: 'ppe-assignments',
      }),
    ],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'Assign PPE to employee',
      description: 'Assigns a PPE item to an employee, deducting from stock',
      body: assignPPESchema,
      response: {
        201: z.object({
          assignment: ppeAssignmentResponseSchema,
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
        const useCase = makeAssignPPEUseCase();
        const { assignment } = await useCase.execute({
          tenantId,
          ...data,
        });

        return reply
          .status(201)
          .send({ assignment: ppeAssignmentToDTO(assignment) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
