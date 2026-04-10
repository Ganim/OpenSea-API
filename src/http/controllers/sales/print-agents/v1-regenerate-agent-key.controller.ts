import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  printAgentParamsSchema,
  regenerateKeyResponseSchema,
} from '@/http/schemas/sales/printing/print-agent.schema';
import { makeRegenerateAgentApiKeyUseCase } from '@/use-cases/sales/print-agents/factories/make-regenerate-agent-api-key-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1RegenerateAgentKeyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/print-agents/:id/regenerate-key',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.ADMIN,
        resource: 'sales-print-agents',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Regenerate agent API key',
      description:
        'Generates a new API key for the agent. The old key is invalidated immediately.',
      params: printAgentParamsSchema,
      response: {
        200: regenerateKeyResponseSchema,
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeRegenerateAgentApiKeyUseCase();
        const { apiKey } = await useCase.execute({
          tenantId: request.user.tenantId!,
          agentId: request.params.id,
        });

        return reply.status(200).send({
          apiKey,
          message: 'Store this API key securely. It will not be shown again.',
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
