import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posTerminalResponseSchema } from '@/http/schemas/sales/pos/pos-terminal.schema';
import { posTerminalToDTO } from '@/mappers/sales/pos-terminal/pos-terminal-to-dto';
import { makePairThisDeviceUseCase } from '@/use-cases/sales/pos-terminals/factories/make-pair-this-device-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const bodySchema = z.object({
  deviceLabel: z.string().min(1).max(128),
});

export async function v1PairThisDeviceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/terminals/:terminalId/pair-self',
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
      summary: 'Pair the current admin device to a terminal (self-pair)',
      params: z.object({ terminalId: z.string().uuid() }),
      body: bodySchema,
      response: {
        201: z.object({
          deviceToken: z.string(),
          terminal: posTerminalResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { terminalId } = request.params;
      const { deviceLabel } = request.body;

      try {
        const useCase = makePairThisDeviceUseCase();
        const { deviceToken, terminal } = await useCase.execute({
          tenantId,
          terminalId,
          deviceLabel,
          pairedByUserId: userId,
        });

        return reply.status(201).send({
          deviceToken,
          terminal: posTerminalToDTO(terminal),
        });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
