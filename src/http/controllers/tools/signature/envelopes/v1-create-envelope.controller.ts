import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createEnvelopeSchema,
  envelopeResponseSchema,
} from '@/http/schemas/signature/signature.schema';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { makeCreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/factories/make-create-envelope-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createEnvelopeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/envelopes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.ENVELOPES.REGISTER,
        resource: 'signature-envelopes',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'Create a signature envelope',
      body: createEnvelopeSchema,
      response: {
        201: z.object({
          envelope: envelopeResponseSchema,
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const useCase = makeCreateEnvelopeUseCase();
      const { envelope } = await useCase.execute({
        tenantId,
        createdByUserId: userId,
        ...body,
      });

      return reply
        .status(201)
        .send({ envelope: signatureEnvelopeToDTO(envelope) });
    },
  });
}
