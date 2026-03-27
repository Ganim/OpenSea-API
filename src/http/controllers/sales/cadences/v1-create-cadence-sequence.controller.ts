import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cadenceSequenceResponseSchema,
  createCadenceSequenceSchema,
} from '@/http/schemas/sales/cadences/cadence.schema';
import { makeCreateCadenceSequenceUseCase } from '@/use-cases/sales/cadence-sequences/factories/make-create-cadence-sequence-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCadenceSequenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/cadences',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CADENCES.REGISTER,
        resource: 'cadences',
      }),
    ],
    schema: {
      tags: ['Sales - Cadences'],
      summary: 'Create a new cadence sequence',
      body: createCadenceSequenceSchema,
      response: {
        201: z.object({
          cadenceSequence: cadenceSequenceResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateCadenceSequenceUseCase();
        const { cadenceSequence } = await useCase.execute({
          tenantId,
          createdBy: userId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CADENCE_CREATE,
          entityId: cadenceSequence.id,
          placeholders: {
            userName: userId,
            cadenceName: cadenceSequence.name,
          },
          newData: { name: body.name, steps: body.steps },
        });

        return reply.status(201).send({ cadenceSequence });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
