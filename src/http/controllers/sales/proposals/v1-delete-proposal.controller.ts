import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteProposalUseCase } from '@/use-cases/sales/proposals/factories/make-delete-proposal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteProposalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/proposals/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROPOSALS.REMOVE,
        resource: 'proposals',
      }),
    ],
    schema: {
      tags: ['Sales - Proposals'],
      summary: 'Soft delete a proposal (DRAFT or REJECTED only)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeDeleteProposalUseCase();
        await useCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PROPOSAL_DELETE,
          entityId: id,
          placeholders: { userName: userId, proposalTitle: 'N/A' },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
