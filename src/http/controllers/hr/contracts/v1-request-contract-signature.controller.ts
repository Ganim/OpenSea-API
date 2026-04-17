import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { envelopeResponseSchema } from '@/http/schemas/signature/signature.schema';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeRequestContractSignatureUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1RequestContractSignatureController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/contracts/:contractId/signature',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.MODIFY,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Send employment contract for digital signature',
      description:
        'Creates a signature envelope (Lei 14.063 ADVANCED level) for a generated employment contract and emails the signer (the employee by default). Accepts optional overrides for the signer email, signer name and expiration window.',
      params: z.object({
        contractId: z.string().min(1),
      }),
      body: z
        .object({
          signerEmail: z.string().email().optional(),
          signerName: z.string().min(1).max(255).optional(),
          expiresInDays: z.number().int().min(1).max(365).optional(),
        })
        .default({}),
      response: {
        201: z.object({
          envelope: envelopeResponseSchema,
          envelopeId: z.string(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { contractId } = request.params;
      const body = request.body as {
        signerEmail?: string;
        signerName?: string;
        expiresInDays?: number;
      };

      try {
        const useCase = makeRequestContractSignatureUseCase();
        const { envelope, envelopeId } = await useCase.execute({
          tenantId,
          contractId,
          userId,
          signerEmail: body?.signerEmail,
          signerName: body?.signerName,
          expiresInDays: body?.expiresInDays,
        });

        return reply.status(201).send({
          envelope: signatureEnvelopeToDTO(envelope),
          envelopeId,
        });
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
