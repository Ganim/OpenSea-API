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
    url: '/v1/signature/envelopes/:id/resend',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.ENVELOPES.MODIFY,
        resource: 'signature-envelopes',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'Resend notifications to pending signers',
      params: z.object({
        id: z.string().uuid().describe('Envelope UUID'),
      }),
      response: {
        200: z.object({
          notifiedCount: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
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
