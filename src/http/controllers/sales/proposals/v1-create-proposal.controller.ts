import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createProposalSchema,
  proposalResponseSchema,
} from '@/http/schemas/sales/proposals/proposal.schema';
import { makeCreateProposalUseCase } from '@/use-cases/sales/proposals/factories/make-create-proposal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createProposalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/proposals',
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
      summary: 'Create a new proposal',
      body: createProposalSchema,
      response: {
        201: z.object({
          proposal: proposalResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateProposalUseCase();
        const { proposal } = await useCase.execute({
          tenantId,
          createdBy: userId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PROPOSAL_CREATE,
          entityId: proposal.id,
          placeholders: { userName: userId, proposalTitle: proposal.title },
          newData: { title: body.title, customerId: body.customerId },
        });

        return reply.status(201).send({ proposal });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
