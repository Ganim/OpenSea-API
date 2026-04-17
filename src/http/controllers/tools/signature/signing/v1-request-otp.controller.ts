import { requestOTPResponseSchema } from '@/http/schemas/signature/signature.schema';
import { makeRequestSignerOTPUseCase } from '@/use-cases/signature/signing/factories/make-request-signer-otp-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function requestOTPController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/signature/sign/:token/otp',
    schema: {
      tags: ['Tools - Digital Signature (Public)'],
      summary: 'Request an OTP for ADVANCED signature (public)',
      description:
        'Gera e envia um código de verificação (OTP) de 6 dígitos para o e-mail do signatário. Obrigatório para o nível ADVANCED (Lei 14.063/2020).',
      params: z.object({
        token: z.string().min(1).describe('Signer access token'),
      }),
      response: {
        200: requestOTPResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        429: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;

      const useCase = makeRequestSignerOTPUseCase();
      const { otpExpiresAt, emailDeliveryError } = await useCase.execute({
        accessToken: token,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });

      return reply.status(200).send({
        otpExpiresAt,
        ...(emailDeliveryError ? { emailDeliveryError } : {}),
      });
    },
  });
}
