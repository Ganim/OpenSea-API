import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { marketplaceConnectionToDTO } from '@/mappers/sales/marketplace/marketplace-connection-to-dto';
import { PrismaMarketplaceConnectionsRepository } from '@/repositories/sales/prisma/prisma-marketplace-connections-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetConnectionByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplace-connections/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.ACCESS,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Connections'],
      summary: 'Get marketplace connection by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ connection: z.any() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const repository = new PrismaMarketplaceConnectionsRepository();
      const connection = await repository.findById(
        new UniqueEntityID(id),
        tenantId,
      );
      if (!connection) {
        return reply.status(404).send({ message: 'Connection not found.' });
      }
      return reply
        .status(200)
        .send({ connection: marketplaceConnectionToDTO(connection) });
    },
  });
}
