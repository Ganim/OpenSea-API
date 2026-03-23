import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  bidContractResponseSchema,
  createBidContractSchema,
} from '@/http/schemas/sales/bids';
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
      tags: ['Sales - Bid Contracts'],
      summary: 'Create a bid contract',
      body: createBidContractSchema,
      response: {
        201: z.object({ contract: bidContractResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateBidContractUseCase();
      const { contract } = await useCase.execute({ tenantId, ...body });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BID_CONTRACT_CREATE,
        entityId: contract.id.toString(),
        placeholders: { userName: userId, contractNumber: body.contractNumber },
        newData: {
          contractNumber: body.contractNumber,
          bidId: body.bidId,
          value: body.totalValue,
        },
      });

      return reply.status(201).send({ contract: bidContractToDTO(contract) });
    },
  });
}
