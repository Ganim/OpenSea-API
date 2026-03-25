import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeConnectMarketplaceUseCase } from '@/use-cases/sales/marketplaces/factories/make-connect-marketplace-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ConnectMarketplaceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/marketplace-connections/:connectionId/connect',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.MODIFY,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Integration'],
      summary: 'Exchange OAuth code and activate marketplace connection',
      params: z.object({ connectionId: z.string().uuid() }),
      body: z.object({
        code: z.string().min(1),
        redirectUri: z.string().url(),
      }),
      response: {
        200: z.object({
          connection: z.any(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const { code, redirectUri } = request.body;

      try {
        const useCase = makeConnectMarketplaceUseCase();
        const result = await useCase.execute({
          tenantId,
          connectionId,
          code,
          redirectUri,
        });

        return reply.status(200).send({ connection: result.connection });
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
