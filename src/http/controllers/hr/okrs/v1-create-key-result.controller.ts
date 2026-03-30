import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createKeyResultSchema,
  keyResultResponseSchema,
} from '@/http/schemas/hr/okrs';
import { idSchema } from '@/http/schemas/common.schema';
import { keyResultToDTO } from '@/mappers/hr/key-result';
import { makeCreateKeyResultUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateKeyResultController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/okrs/objectives/:objectiveId/key-results',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'Create a key result',
      description: 'Creates a new key result for an objective',
      params: z.object({ objectiveId: idSchema }),
      body: createKeyResultSchema,
      response: {
        201: keyResultResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { objectiveId } = request.params;

      const useCase = makeCreateKeyResultUseCase();
      const { keyResult } = await useCase.execute({
        tenantId,
        objectiveId,
        ...request.body,
      });

      return reply.status(201).send(keyResultToDTO(keyResult));
    },
  });
}
