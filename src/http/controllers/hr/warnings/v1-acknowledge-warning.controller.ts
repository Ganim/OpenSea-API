import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { warningResponseSchema } from '@/http/schemas/hr/warnings';
import { employeeWarningToDTO } from '@/mappers/hr/employee-warning';
import { makeAcknowledgeWarningUseCase } from '@/use-cases/hr/warnings/factories/make-acknowledge-warning-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AcknowledgeWarningController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/warnings/:warningId/acknowledge',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Warnings'],
      summary: 'Acknowledge employee warning',
      description: 'Employee acknowledges a warning issued to them',
      params: z.object({
        warningId: idSchema,
      }),
      response: {
        200: z.object({
          warning: warningResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { warningId } = request.params;

      try {
        const acknowledgeWarningUseCase = makeAcknowledgeWarningUseCase();
        const { warning } = await acknowledgeWarningUseCase.execute({
          tenantId,
          warningId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.WARNING_ACKNOWLEDGE,
          entityId: warning.id.toString(),
          placeholders: {},
        });

        return reply
          .status(200)
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
