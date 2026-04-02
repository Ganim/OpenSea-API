import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  returnPPESchema,
  ppeAssignmentResponseSchema,
} from '@/http/schemas/hr/safety';
import { cuidSchema } from '@/http/schemas/common.schema';
import { ppeAssignmentToDTO } from '@/mappers/hr/ppe-assignment';
import { makeReturnPPEUseCase } from '@/use-cases/hr/ppe-assignments/factories/make-return-ppe-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ReturnPPEController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/ppe-assignments/:assignmentId/return',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PPE.MODIFY,
        resource: 'ppe-assignments',
      }),
    ],
    schema: {
      tags: ['HR - PPE (EPI)'],
      summary: 'Return PPE assignment',
      description:
        'Marks a PPE assignment as returned, optionally restoring stock if not damaged',
      params: z.object({
        assignmentId: cuidSchema,
      }),
      body: returnPPESchema,
      response: {
        200: z.object({
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
      const { assignmentId } = request.params;
      const data = request.body;

      try {
        const useCase = makeReturnPPEUseCase();
        const { assignment } = await useCase.execute({
          tenantId,
          assignmentId,
          ...data,
        });

        return reply
          .status(200)
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
