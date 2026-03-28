import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWarningSchema,
  warningResponseSchema,
} from '@/http/schemas/hr/warnings';
import { employeeWarningToDTO } from '@/mappers/hr/employee-warning';
import { makeCreateWarningUseCase } from '@/use-cases/hr/warnings/factories/make-create-warning-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateWarningController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/warnings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WARNINGS.REGISTER,
        resource: 'warnings',
      }),
    ],
    schema: {
      tags: ['HR - Warnings'],
      summary: 'Create employee warning',
      description: 'Creates a new disciplinary warning for an employee',
      body: createWarningSchema,
      response: {
        201: z.object({
          warning: warningResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const warningData = request.body;

      try {
        const createWarningUseCase = makeCreateWarningUseCase();
        const { warning } = await createWarningUseCase.execute({
          ...warningData,
          tenantId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.WARNING_CREATE,
          entityId: warning.id.toString(),
          placeholders: {
            employeeName: warning.employeeId.toString(),
            warningType: warning.type.value,
          },
          newData: warningData as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ warning: employeeWarningToDTO(warning) });
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
