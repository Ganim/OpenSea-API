import { signingPageResponseSchema } from '@/http/schemas/signature/signature.schema';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getSigningPageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/sign/:token',
    schema: {
      tags: ['Tools - Digital Signature (Public)'],
      summary: 'Get signing page data (public)',
      params: z.object({
        token: z.string().min(1).describe('Signer access token'),
      }),
      response: {
        200: z.object({
          signing: signingPageResponseSchema,
        }),
        404: z.object({ message: z.string() }),
        410: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;

      const signersRepository = new PrismaSignatureEnvelopeSignersRepository();
      const signer = await signersRepository.findByAccessToken(token);

      if (!signer) {
        return reply.status(404).send({ message: 'Invalid signing link' });
      }

      if (
        signer.accessTokenExpiresAt &&
        signer.accessTokenExpiresAt < new Date()
      ) {
        return reply.status(410).send({ message: 'Signing link has expired' });
      }

      const envelopesRepository = new PrismaSignatureEnvelopesRepository();
      const envelope = await envelopesRepository.findById(
        new UniqueEntityID(signer.envelopeId),
        signer.tenantId.toString(),
      );

      if (!envelope) {
        return reply.status(404).send({ message: 'Envelope not found' });
      }

      return reply.status(200).send({
        signing: {
          envelopeTitle: envelope.title,
          envelopeDescription: envelope.description ?? null,
          documentFileId: envelope.documentFileId,
          signerName: signer.externalName ?? null,
          signerEmail: signer.externalEmail ?? null,
          signerRole: signer.role,
          signerStatus: signer.status,
          signatureLevel: signer.signatureLevel,
        },
      });
    },
  });
}
