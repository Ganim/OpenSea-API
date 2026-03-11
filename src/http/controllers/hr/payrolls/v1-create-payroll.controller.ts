import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPayrollSchema, payrollResponseSchema } from '@/http/schemas';
import { payrollToDTO } from '@/mappers/hr/payroll';
import { makeCreatePayrollUseCase } from '@/use-cases/hr/payrolls/factories/make-create-payroll-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPayrollController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/payrolls',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PAYROLLS.CREATE,
        resource: 'payrolls',
      }),
    ],
    schema: {
      tags: ['HR - Payroll'],
      summary: 'Create payroll',
      description: 'Creates a new payroll for a specific month/year',
      body: createPayrollSchema,
      response: {
        201: z.object({
          payroll: payrollResponseSchema,
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
        const createPayrollUseCase = makeCreatePayrollUseCase();
        const { payroll } = await createPayrollUseCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PAYROLL_CREATE,
          entityId: payroll.id.toString(),
          placeholders: {
            userName: request.user.sub,
            month: String(payroll.referenceMonth),
            year: String(payroll.referenceYear),
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(201).send({ payroll: payrollToDTO(payroll) });
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
