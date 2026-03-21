import { signatureEnvelopeSignerToDTO } from '@/mappers/signature';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { signatureEnvelopeToDTO } from '@/mappers/signature';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getSigningPageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/sign/:token',
    schema: {
      tags: ['Signature - Signing (Public)'],
      summary: 'Get signing page data (public - no auth)',
      params: z.object({ token: z.string() }),
    },
    handler: async (request, reply) => {
      const { token } = request.params;

      const signersRepo = new PrismaSignatureEnvelopeSignersRepository();
      const signer = await signersRepo.findByAccessToken(token);

      if (!signer) {
        return reply.status(404).send({ error: 'Invalid signing link' });
      }

      if (
        signer.accessTokenExpiresAt &&
        signer.accessTokenExpiresAt < new Date()
      ) {
        return reply.status(410).send({ error: 'Signing link has expired' });
      }

      const envelopesRepo = new PrismaSignatureEnvelopesRepository();
      const envelope = await envelopesRepo.findById(
        new UniqueEntityID(signer.envelopeId),
        signer.tenantId.toString(),
      );

      if (!envelope) {
        return reply.status(404).send({ error: 'Envelope not found' });
      }

      return reply.status(200).send({
        signer: signatureEnvelopeSignerToDTO(signer),
        envelope: {
          id: envelope.envelopeId.toString(),
          title: envelope.title,
          description: envelope.description,
          status: envelope.status,
          signatureLevel: envelope.signatureLevel,
          documentFileId: envelope.documentFileId,
          documentType: envelope.documentType,
        },
      });
    },
  });
}
