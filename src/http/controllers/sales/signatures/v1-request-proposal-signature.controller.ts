import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { envelopeResponseSchema } from '@/http/schemas/signature/signature.schema';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeRequestProposalSignatureUseCase } from '@/use-cases/sales/signatures/factories/make-request-proposal-signature-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function requestProposalSignatureController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/proposals/:id/request-signature',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROPOSALS.ADMIN,
        resource: 'proposals',
      }),
    ],
    schema: {
      tags: ['Sales - Proposals'],
      summary: 'Request digital signature for a proposal',
      description:
        'Creates a signature envelope for the proposal and sends it to the customer for signing.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        signerEmail: z.string().email().optional(),
        signerName: z.string().min(1).max(255).optional(),
        documentFileId: z.string().uuid(),
        documentHash: z.string().min(1),
      }),
      response: {
        201: z.object({
          envelope: envelopeResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body as {
        signerEmail?: string;
        signerName?: string;
        documentFileId: string;
        documentHash: string;
      };

      try {
        const useCase = makeRequestProposalSignatureUseCase();
        const { envelope } = await useCase.execute({
          tenantId,
          proposalId: id,
          userId,
          signerEmail: body.signerEmail,
          signerName: body.signerName,
          documentFileId: body.documentFileId,
          documentHash: body.documentHash,
        });

        return reply
          .status(201)
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
