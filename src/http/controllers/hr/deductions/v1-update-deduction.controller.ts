import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateDeductionSchema,
  deductionResponseSchema,
  idSchema,
} from '@/http/schemas';
import { deductionToDTO } from '@/mappers/hr/deduction';
import { makeUpdateDeductionUseCase } from '@/use-cases/hr/deductions/factories/make-update-deduction-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateDeductionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/deductions/:deductionId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DEDUCTIONS.MODIFY,
        resource: 'deductions',
      }),
    ],
    schema: {
      tags: ['HR - Deduction'],
      summary: 'Update deduction',
      description: 'Updates an existing deduction',
      params: z.object({
        deductionId: idSchema,
      }),
      body: updateDeductionSchema,
      response: {
        200: z.object({
          deduction: deductionResponseSchema,
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
      const { deductionId } = request.params;
      const data = request.body;

      try {
        const updateDeductionUseCase = makeUpdateDeductionUseCase();
        const { deduction } = await updateDeductionUseCase.execute({
          tenantId,
          deductionId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.DEDUCTION_UPDATE,
          entityId: deduction.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: deduction.employeeId.toString(),
            description: deduction.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(200).send({ deduction: deductionToDTO(deduction) });
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
