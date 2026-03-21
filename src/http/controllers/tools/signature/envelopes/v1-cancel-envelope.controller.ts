import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCancelEnvelopeUseCase } from '@/use-cases/signature/envelopes/factories/make-cancel-envelope-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function cancelEnvelopeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/signature/envelopes/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.ENVELOPES.MODIFY,
        resource: 'signature-envelopes',
      }),
    ],
    schema: {
      tags: ['Signature - Envelopes'],
      summary: 'Cancel a signature envelope',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        reason: z.string().optional(),
      }).optional(),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const reason = (request.body as { reason?: string } | undefined)?.reason;

      const useCase = makeCancelEnvelopeUseCase();
      await useCase.execute({ tenantId, envelopeId: id, reason });

      return reply.status(204).send();
    },
  });
}
