import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeResendNotificationsUseCase } from '@/use-cases/signature/envelopes/factories/make-resend-notifications-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function resendNotificationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/envelopes/:id/resend-notifications',
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
      summary: 'Resend notifications to pending signers',
      params: z.object({ id: z.string().uuid() }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeResendNotificationsUseCase();
      const { notifiedCount } = await useCase.execute({
        tenantId,
        envelopeId: id,
      });

      return reply.status(200).send({ notifiedCount });
    },
  });
}
