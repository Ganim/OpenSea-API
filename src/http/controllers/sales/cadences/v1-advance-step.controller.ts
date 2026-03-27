import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cadenceEnrollmentResponseSchema } from '@/http/schemas/sales/cadences/cadence.schema';
import { makeAdvanceStepUseCase } from '@/use-cases/sales/cadence-sequences/factories/make-advance-step-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function advanceStepController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/cadences/enrollments/:enrollmentId/advance',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CADENCES.EXECUTE,
        resource: 'cadences',
      }),
    ],
    schema: {
      tags: ['Sales - Cadences'],
      summary: 'Advance an enrollment to the next step',
      params: z.object({ enrollmentId: z.string().uuid() }),
      response: {
        200: z.object({
          enrollment: cadenceEnrollmentResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { enrollmentId } = request.params;

      try {
        const useCase = makeAdvanceStepUseCase();
        const { enrollment } = await useCase.execute({
          enrollmentId,
          tenantId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CADENCE_ADVANCE_STEP,
          entityId: enrollment.id,
          placeholders: {
            userName: userId,
            cadenceName: enrollment.sequenceId,
            stepOrder: String(enrollment.currentStepOrder),
          },
        });

        return reply.status(200).send({ enrollment });
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
