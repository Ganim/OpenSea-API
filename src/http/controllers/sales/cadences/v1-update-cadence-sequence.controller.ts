import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cadenceSequenceResponseSchema,
  updateCadenceSequenceSchema,
} from '@/http/schemas/sales/cadences/cadence.schema';
import { makeUpdateCadenceSequenceUseCase } from '@/use-cases/sales/cadence-sequences/factories/make-update-cadence-sequence-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateCadenceSequenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/sales/cadences/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CADENCES.MODIFY,
        resource: 'cadences',
      }),
    ],
    schema: {
      tags: ['Sales - Cadences'],
      summary: 'Update a cadence sequence',
      params: z.object({ id: z.string().uuid() }),
      body: updateCadenceSequenceSchema,
      response: {
        200: z.object({
          cadenceSequence: cadenceSequenceResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const useCase = makeUpdateCadenceSequenceUseCase();
        const { cadenceSequence } = await useCase.execute({
          id,
          tenantId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CADENCE_UPDATE,
          entityId: cadenceSequence.id,
          placeholders: {
            userName: userId,
            cadenceName: cadenceSequence.name,
          },
          newData: body as Record<string, unknown>,
        });

        return reply.status(200).send({ cadenceSequence });
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
