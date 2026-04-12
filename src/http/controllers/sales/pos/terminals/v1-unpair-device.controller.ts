import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUnpairDeviceUseCase } from '@/use-cases/sales/pos-terminals/factories/make-unpair-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UnpairDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/pos/terminals/:terminalId/pairing',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TERMINALS.UNPAIR,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['POS - Terminals'],
      summary: 'Revoke the active device pairing for a terminal',
      params: z.object({ terminalId: z.string().uuid() }),
      body: z
        .object({ reason: z.string().max(256).optional() })
        .optional()
        .nullable(),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { terminalId } = request.params;
      const reason = (request.body as { reason?: string } | undefined | null)
        ?.reason;

      try {
        const useCase = makeUnpairDeviceUseCase();
        await useCase.execute({
          tenantId,
          terminalId,
          revokedByUserId: userId,
          reason,
        });
        return reply.status(204).send(null);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
