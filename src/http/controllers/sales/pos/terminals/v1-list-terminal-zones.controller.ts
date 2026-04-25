import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListTerminalZonesUseCase } from '@/use-cases/sales/pos-terminals/factories/make-list-terminal-zones-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const terminalZoneEnrichedSchema = z.object({
  id: z.string(),
  terminalId: z.string(),
  zoneId: z.string(),
  tier: z.enum(['PRIMARY', 'SECONDARY']),
  tenantId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  zone: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    allowsFractionalSale: z.boolean(),
    warehouseId: z.string(),
    warehouseName: z.string(),
  }),
});

export async function v1ListTerminalZonesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/terminals/:terminalId/zones',
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
      summary: 'List zones assigned to a POS terminal (enriched)',
      description:
        'Returns the Zones linked to the terminal enriched with the Zone metadata (code, name, allowsFractionalSale) and the parent warehouse name. Used by the RP Zones tab.',
      params: z.object({ terminalId: z.string().uuid() }),
      response: {
        200: z.object({ zones: z.array(terminalZoneEnrichedSchema) }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { terminalId } = request.params;

      try {
        const useCase = makeListTerminalZonesUseCase();
        const result = await useCase.execute({ tenantId, terminalId });
        return reply.send({ zones: result.zones });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
