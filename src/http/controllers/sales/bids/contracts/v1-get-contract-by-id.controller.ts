import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bidContractResponseSchema } from '@/http/schemas/sales/bids';
import { makeGetBidContractByIdUseCase } from '@/use-cases/sales/bids/factories/make-get-bid-contract-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBidContractByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/bid-contracts/:contractId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BID_CONTRACTS.ACCESS,
        resource: 'bid-contracts',
      }),
    ],
    schema: {
      tags: ['Sales - Bid Contracts'],
      summary: 'Get a bid contract by ID',
      params: z.object({
        contractId: z.string().uuid().describe('Contract UUID'),
      }),
      response: {
        200: z.object({ contract: bidContractResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { contractId } = request.params;

      const useCase = makeGetBidContractByIdUseCase();
      const { contract } = (await useCase.execute({
        id: contractId,
        tenantId,
      })) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      return reply.status(200).send({ contract });
    },
  });
}
