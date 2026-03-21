import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeGetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/factories/make-get-envelope-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getEnvelopeByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/envelopes/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.ENVELOPES.ACCESS,
        resource: 'signature-envelopes',
      }),
    ],
    schema: {
      tags: ['Signature - Envelopes'],
      summary: 'Get envelope details with signers and audit trail',
      params: z.object({ id: z.string().uuid() }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeGetEnvelopeByIdUseCase();
      const { envelope } = await useCase.execute({ tenantId, envelopeId: id });

      return reply.status(200).send({
        envelope: signatureEnvelopeToDTO(envelope),
      });
    },
  });
}
