import {
  verifyByCodeParamsSchema,
  verifyByCodeResponseSchema,
} from '@/http/schemas/signature/signature.schema';
import { makeVerifySignatureByCodeUseCase } from '@/use-cases/signature/public/factories/make-verify-signature-by-code-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function verifyByCodeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/verify/:code',
    schema: {
      tags: ['Tools - Digital Signature (Public)'],
      summary: 'Verify document authenticity by verification code (public)',
      description:
        'Consulta pública da autenticidade do envelope pelo código de verificação. Retorna status, signatários, timestamp e hash SHA-256 do documento. Conforme Lei 14.063/2020.',
      params: verifyByCodeParamsSchema,
      response: {
        200: verifyByCodeResponseSchema,
        404: z.object({ message: z.string() }),
        429: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { code } = request.params;

      const useCase = makeVerifySignatureByCodeUseCase();
      const response = await useCase.execute({ verificationCode: code });

      return reply.status(200).send(response);
    },
  });
}
