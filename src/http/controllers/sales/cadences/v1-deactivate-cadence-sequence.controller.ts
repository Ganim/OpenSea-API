import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cadenceSequenceResponseSchema } from '@/http/schemas/sales/cadences/cadence.schema';
import { makeDeactivateCadenceSequenceUseCase } from '@/use-cases/sales/cadence-sequences/factories/make-deactivate-cadence-sequence-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deactivateCadenceSequenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/cadences/:id/deactivate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CADENCES.ADMIN,
        resource: 'cadences',
      }),
    ],
    schema: {
      tags: ['Sales - Cadences'],
      summary: 'Deactivate a cadence sequence',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          cadenceSequence: cadenceSequenceResponseSchema,
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeDeactivateCadenceSequenceUseCase();
        const { cadenceSequence } = await useCase.execute({ id, tenantId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CADENCE_DEACTIVATE,
          entityId: cadenceSequence.id,
          placeholders: {
            userName: userId,
            cadenceName: cadenceSequence.name,
          },
        });

        return reply.status(200).send({ cadenceSequence });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
