import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  getPairingCodeResponseSchema,
  printAgentParamsSchema,
} from '@/http/schemas/sales/printing/print-agent.schema';
import { makeGetAgentPairingCodeUseCase } from '@/use-cases/sales/print-agents/factories/make-get-agent-pairing-code-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetPairingCodeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/print-agents/:id/pairing-code',
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
      summary: 'Get current pairing code for an agent',
      description:
        'Returns a 6-character TOTP-like pairing code that rotates every 60 seconds. The operator types this code into the agent software to pair it.',
      params: printAgentParamsSchema,
      response: {
        200: getPairingCodeResponseSchema,
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeGetAgentPairingCodeUseCase();
        const { code, expiresAt } = await useCase.execute({
          tenantId: request.user.tenantId!,
          agentId: request.params.id,
        });

        return reply.status(200).send({
          code,
          expiresAt: expiresAt.toISOString(),
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
