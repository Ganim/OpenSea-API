import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { proposalResponseSchema } from '@/http/schemas/sales/proposals/proposal.schema';
import { makeDuplicateProposalUseCase } from '@/use-cases/sales/proposals/factories/make-duplicate-proposal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function duplicateProposalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/proposals/:id/duplicate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROPOSALS.REGISTER,
        resource: 'proposals',
      }),
    ],
    schema: {
      tags: ['Sales - Proposals'],
      summary: 'Duplicate a proposal as a new DRAFT',
      params: z.object({ id: z.string().uuid() }),
      response: {
        201: z.object({ proposal: proposalResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeDuplicateProposalUseCase();
        const { proposal } = await useCase.execute({
          tenantId,
          id,
          createdBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PROPOSAL_DUPLICATE,
          entityId: proposal.id,
          placeholders: { userName: userId, proposalTitle: proposal.title },
        });

        return reply.status(201).send({ proposal } as unknown);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
