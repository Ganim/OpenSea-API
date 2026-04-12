import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetPairingCodeUseCase } from '@/use-cases/sales/pos-terminals/factories/make-get-pairing-code-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetPairingCodeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/terminals/:terminalId/pairing-code',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TERMINALS.PAIR,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['POS - Terminals'],
      summary: 'Get the current rotating pairing code for a terminal',
      params: z.object({ terminalId: z.string().uuid() }),
      response: {
        200: z.object({
          code: z.string(),
          expiresAt: z.string(),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { terminalId } = request.params;

      try {
        const useCase = makeGetPairingCodeUseCase();
        const { code, expiresAt } = await useCase.execute({
          tenantId,
          terminalId,
        });
        return reply.send({
          code,
          expiresAt: expiresAt.toISOString(),
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
