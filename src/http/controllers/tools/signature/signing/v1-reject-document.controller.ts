import { rejectDocumentSchema } from '@/http/schemas/signature/signature.schema';
import { makeRejectDocumentUseCase } from '@/use-cases/signature/signing/factories/make-reject-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function rejectDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/sign/:token/reject',
    schema: {
      tags: ['Tools - Digital Signature (Public)'],
      summary: 'Reject a document (public)',
      params: z.object({
        token: z.string().min(1).describe('Signer access token'),
      }),
      body: rejectDocumentSchema,
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;
      const body = request.body;

      const useCase = makeRejectDocumentUseCase();
      await useCase.execute({
        accessToken: token,
        reason: body.reason,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(204).send(null);
    },
  });
}
