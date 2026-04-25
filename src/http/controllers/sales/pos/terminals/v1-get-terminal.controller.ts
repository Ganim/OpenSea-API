import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posTerminalResponseSchema } from '@/http/schemas/sales/pos/pos-terminal.schema';
import { posTerminalToDTO } from '@/mappers/sales/pos-terminal/pos-terminal-to-dto';
import { makeGetPosTerminalUseCase } from '@/use-cases/sales/pos-terminals/factories/make-get-pos-terminal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetTerminalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/terminals/:terminalId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TERMINALS.ACCESS,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['POS - Terminals'],
      summary: 'Get a single POS terminal by id',
      params: z.object({ terminalId: z.string().uuid() }),
      response: {
        200: z.object({ terminal: posTerminalResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { terminalId } = request.params;

      try {
        const useCase = makeGetPosTerminalUseCase();
        const result = await useCase.execute({ tenantId, terminalId });

        return reply.send({ terminal: posTerminalToDTO(result.terminal) });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
