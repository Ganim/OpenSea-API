import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  registerPrintAgentBodySchema,
  registerPrintAgentResponseSchema,
} from '@/http/schemas/sales/printing/print-agent.schema';
import { makeRegisterPrintAgentUseCase } from '@/use-cases/sales/print-agents/factories/make-register-print-agent-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1RegisterPrintAgentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/print-agents',
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
      summary: 'Register a new print agent',
      description:
        'Creates a print agent and returns the API key. Store the key securely — it cannot be retrieved later.',
      body: registerPrintAgentBodySchema,
      response: {
        201: registerPrintAgentResponseSchema,
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const useCase = makeRegisterPrintAgentUseCase();
      const { agentId, apiKey } = await useCase.execute({
        tenantId: request.user.tenantId!,
        name: request.body.name,
      });

      return reply.status(201).send({
        agentId,
        apiKey,
        message: 'Store this API key securely. It will not be shown again.',
      });
    },
  });
}
