import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { envelopeDetailResponseSchema } from '@/http/schemas/signature/signature.schema';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeGetProposalSignatureStatusUseCase } from '@/use-cases/sales/signatures/factories/make-get-proposal-signature-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getProposalSignatureStatusController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/proposals/:id/signature-status',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROPOSALS.ACCESS,
        resource: 'proposals',
      }),
    ],
    schema: {
      tags: ['Sales - Proposals'],
      summary: 'Get signature status for a proposal',
      description:
        'Returns the signature envelope and signer statuses for a proposal that has been sent for signing.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          envelope: envelopeDetailResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetProposalSignatureStatusUseCase();
        const { envelope } = await useCase.execute({
          tenantId,
          proposalId: id,
        });

        return reply
          .status(200)
          .send({ envelope: signatureEnvelopeToDTO(envelope) });
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
