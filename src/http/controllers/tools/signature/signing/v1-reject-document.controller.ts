import { makeRejectDocumentUseCase } from '@/use-cases/signature/signing/factories/make-reject-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function rejectDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/sign/:token/reject',
    schema: {
      tags: ['Signature - Signing (Public)'],
      summary: 'Reject signing a document (public - token-based)',
      params: z.object({ token: z.string() }),
      body: z.object({
        reason: z.string().min(1).max(500),
      }),
    },
    handler: async (request, reply) => {
      const { token } = request.params;
      const { reason } = request.body;

      const useCase = makeRejectDocumentUseCase();
      await useCase.execute({
        accessToken: token,
        reason,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(200).send({ message: 'Document rejected' });
    },
  });
}
