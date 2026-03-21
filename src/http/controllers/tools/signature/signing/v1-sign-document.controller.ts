import { makeSignDocumentUseCase } from '@/use-cases/signature/signing/factories/make-sign-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function signDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/sign/:token',
    schema: {
      tags: ['Signature - Signing (Public)'],
      summary: 'Sign a document (public - token-based)',
      params: z.object({ token: z.string() }),
      body: z.object({
        signatureData: z.record(z.string(), z.unknown()).optional(),
        signatureImageFileId: z.string().uuid().optional(),
        geoLatitude: z.number().optional(),
        geoLongitude: z.number().optional(),
      }).optional(),
    },
    handler: async (request, reply) => {
      const { token } = request.params;
      const body = request.body ?? {};

      const useCase = makeSignDocumentUseCase();
      await useCase.execute({
        accessToken: token,
        signatureData: body.signatureData as Record<string, unknown> | undefined,
        signatureImageFileId: body.signatureImageFileId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        geoLatitude: body.geoLatitude,
        geoLongitude: body.geoLongitude,
      });

      return reply.status(200).send({ message: 'Document signed successfully' });
    },
  });
}
