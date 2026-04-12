import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updatePosTerminalSchema,
  posTerminalResponseSchema,
} from '@/http/schemas/sales/pos/pos-terminal.schema';
import { posTerminalToDTO } from '@/mappers/sales/pos-terminal/pos-terminal-to-dto';
import { makeUpdatePosTerminalUseCase } from '@/use-cases/sales/pos-terminals/factories/make-update-pos-terminal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UpdateTerminalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/pos/terminals/:terminalId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TERMINALS.MODIFY,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['POS - Terminals'],
      summary: 'Update a POS terminal',
      params: z.object({ terminalId: z.string().uuid() }),
      body: updatePosTerminalSchema,
      response: {
        200: z.object({ terminal: posTerminalResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { terminalId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdatePosTerminalUseCase();
        const result = await useCase.execute({ tenantId, terminalId, ...data });

        return reply.send({
          terminal: posTerminalToDTO(result.terminal),
        });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
