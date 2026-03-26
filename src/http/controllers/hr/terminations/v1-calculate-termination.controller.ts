import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  calculateTerminationSchema,
  terminationCalculationResponseSchema,
} from '@/http/schemas';
import { terminationToDTO } from '@/mappers/hr/termination';
import { makeCalculateTerminationPaymentUseCase } from '@/use-cases/hr/terminations/factories/make-calculate-termination-payment-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CalculateTerminationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/terminations/:id/calculate',
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
      summary: 'Calculate termination payment (verbas rescisórias)',
      description:
        'Calculates all termination payment components according to Brazilian labor law',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: calculateTerminationSchema,
      response: {
        200: terminationCalculationResponseSchema,
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
      const { totalFgtsBalance } = request.body;

      try {
        const useCase = makeCalculateTerminationPaymentUseCase();
        const { termination, breakdown } = await useCase.execute({
          tenantId,
          terminationId: id,
          totalFgtsBalance,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TERMINATION_CALCULATE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            employeeName: termination.employeeId.toString(),
            totalLiquido: String(breakdown.totalLiquido),
          },
          newData: breakdown as unknown as Record<string, unknown>,
        });

        return reply.status(200).send({
          termination: terminationToDTO(termination),
          breakdown,
        });
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
