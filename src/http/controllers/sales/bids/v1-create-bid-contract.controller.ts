import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createBidContractSchema,
  bidContractResponseSchema,
} from '@/http/schemas/sales/bids/bid.schema';
import { bidContractToDTO } from '@/mappers/sales/bid-contract/bid-contract-to-dto';
import { makeCreateBidContractUseCase } from '@/use-cases/sales/bids/factories/make-create-bid-contract-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createBidContractController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/bid-contracts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_CONTRACTS.REGISTER,
        resource: 'bid-contracts',
      }),
    ],
    schema: {
      tags: ['Sales - Bids (Licitacoes)'],
      summary: 'Create a contract from a won bid',
      body: createBidContractSchema,
      response: {
        201: z.object({ contract: bidContractResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateBidContractUseCase();
      const { contract } = await useCase.execute({
        tenantId,
        userId,
        ...body,
      });

      return reply.status(201).send({ contract: bidContractToDTO(contract) });
    },
  });
}
