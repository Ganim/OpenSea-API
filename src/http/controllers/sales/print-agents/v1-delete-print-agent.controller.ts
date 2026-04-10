import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { printAgentParamsSchema } from '@/http/schemas/sales/printing/print-agent.schema';
import { makeDeletePrintAgentUseCase } from '@/use-cases/sales/print-agents/factories/make-delete-print-agent-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1DeletePrintAgentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/print-agents/:id',
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
      summary: 'Delete a print agent',
      description:
        'Soft-deletes a print agent and disassociates all linked printers.',
      params: printAgentParamsSchema,
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeDeletePrintAgentUseCase();
        await useCase.execute({
          tenantId: request.user.tenantId!,
          agentId: request.params.id,
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
