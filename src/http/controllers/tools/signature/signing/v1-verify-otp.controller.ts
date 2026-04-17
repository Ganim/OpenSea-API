import {
  verifyOTPBodySchema,
  verifyOTPResponseSchema,
} from '@/http/schemas/signature/signature.schema';
import { makeVerifySignerOTPUseCase } from '@/use-cases/signature/signing/factories/make-verify-signer-otp-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function verifyOTPController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/sign/:token/otp/verify',
    schema: {
      tags: ['Tools - Digital Signature (Public)'],
      summary: 'Verify an OTP for ADVANCED signature (public)',
      description:
        'Valida o código OTP de 6 dígitos enviado por e-mail. Após 3 tentativas inválidas, o signatário é bloqueado e precisa solicitar novo OTP.',
      params: z.object({
        token: z.string().min(1).describe('Signer access token'),
      }),
      body: verifyOTPBodySchema,
      response: {
        200: verifyOTPResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        410: z.object({ message: z.string() }),
        429: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;
      const { otpCode } = request.body;

      const useCase = makeVerifySignerOTPUseCase();
      const { verified } = await useCase.execute({
        accessToken: token,
        otpCode,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(200).send({ verified });
    },
  });
}
