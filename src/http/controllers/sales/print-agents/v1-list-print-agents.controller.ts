import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listPrintAgentsResponseSchema } from '@/http/schemas/sales/printing/print-agent.schema';
import { makeListPrintAgentsUseCase } from '@/use-cases/sales/print-agents/factories/make-list-print-agents-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1ListPrintAgentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/print-agents',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.ACCESS,
        resource: 'sales-print-agents',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'List all print agents',
      description:
        'Returns all print agents for the current tenant with printer count and pairing status.',
      response: {
        200: listPrintAgentsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const useCase = makeListPrintAgentsUseCase();
      const { agents } = await useCase.execute({
        tenantId: request.user.tenantId!,
      });

      return reply.status(200).send({
        agents: agents.map(({ agent, printerCount }) => ({
          id: agent.id.toString(),
          name: agent.name,
          status: agent.status,
          isPaired: agent.isPaired,
          deviceLabel: agent.deviceLabel ?? null,
          pairedAt: agent.pairedAt?.toISOString() ?? null,
          lastSeenAt: agent.lastSeenAt?.toISOString() ?? null,
          ipAddress: agent.ipAddress ?? null,
          hostname: agent.hostname ?? null,
          version: agent.version ?? null,
          printerCount,
          createdAt: agent.createdAt.toISOString(),
        })),
      });
    },
  });
}
