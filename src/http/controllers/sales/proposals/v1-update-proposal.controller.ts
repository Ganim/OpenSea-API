import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  proposalResponseSchema,
  updateProposalSchema,
} from '@/http/schemas/sales/proposals/proposal.schema';
import { makeUpdateProposalUseCase } from '@/use-cases/sales/proposals/factories/make-update-proposal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateProposalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/sales/proposals/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROPOSALS.MODIFY,
        resource: 'proposals',
      }),
    ],
    schema: {
      tags: ['Sales - Proposals'],
      summary: 'Update a draft proposal',
      params: z.object({ id: z.string().uuid() }),
      body: updateProposalSchema,
      response: {
        200: z.object({ proposal: proposalResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const useCase = makeUpdateProposalUseCase();
        const { proposal } = await useCase.execute({
          tenantId,
          id,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PROPOSAL_UPDATE,
          entityId: proposal.id,
          placeholders: { userName: userId, proposalTitle: proposal.title },
          newData: body as Record<string, unknown>,
        });

        return reply.status(200).send({ proposal } as unknown);
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
