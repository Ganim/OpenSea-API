import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  terminationResponseSchema,
  updateTerminationSchema,
} from '@/http/schemas';
import { terminationToDTO } from '@/mappers/hr/termination';
import { makeUpdateTerminationUseCase } from '@/use-cases/hr/terminations/factories/make-update-termination-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateTerminationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/terminations/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'terminations',
      }),
    ],
    schema: {
      tags: ['HR - Terminations'],
      summary: 'Update termination (mark as paid)',
      description:
        'Updates a termination record, primarily to mark it as paid',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateTerminationSchema,
      response: {
        200: z.object({
          termination: terminationResponseSchema,
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
      const { id } = request.params;
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeUpdateTerminationUseCase();
        const { termination } = await useCase.execute({
          tenantId,
          terminationId: id,
          ...data,
        });

        if (data.markAsPaid) {
          await logAudit(request, {
            message: AUDIT_MESSAGES.HR.TERMINATION_PAY,
            entityId: id,
            placeholders: {
              userName: request.user.sub,
              employeeName: termination.employeeId.toString(),
            },
            newData: { status: 'PAID' },
          });
        }

        return reply
          .status(200)
          .send({ termination: terminationToDTO(termination) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
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
