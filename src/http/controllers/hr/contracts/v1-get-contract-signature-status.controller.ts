import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { envelopeDetailResponseSchema } from '@/http/schemas/signature/signature.schema';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeGetContractSignatureStatusUseCase } from '@/use-cases/hr/contracts/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetContractSignatureStatusController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/contracts/:contractId/signature',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CONTRACTS.ACCESS,
        resource: 'contracts',
      }),
    ],
    schema: {
      tags: ['HR - Contracts'],
      summary: 'Get signature status of an employment contract',
      description:
        'Returns the envelope (with signer list and audit trail) attached to the given employment contract.',
      params: z.object({
        contractId: z.string().min(1),
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
      const tenantId = request.user.tenantId!;
      const { contractId } = request.params;

      try {
        const useCase = makeGetContractSignatureStatusUseCase();
        const { envelope } = await useCase.execute({
          tenantId,
          contractId,
        });

        return reply.status(200).send({
          envelope: signatureEnvelopeToDTO(envelope),
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
