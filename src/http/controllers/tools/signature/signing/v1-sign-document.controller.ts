import { signDocumentSchema } from '@/http/schemas/signature/signature.schema';
import { makeSignDocumentUseCase } from '@/use-cases/signature/signing/factories/make-sign-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function signDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/sign/:token',
    schema: {
      tags: ['Tools - Digital Signature (Public)'],
      summary: 'Sign a document (public)',
      params: z.object({
        token: z.string().min(1).describe('Signer access token'),
      }),
      body: signDocumentSchema,
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;
      const body = request.body;

      const useCase = makeSignDocumentUseCase();
      await useCase.execute({
        accessToken: token,
        signatureData: body.signatureData,
        signatureImageFileId: body.signatureImageFileId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(204).send(null);
    },
  });
}
