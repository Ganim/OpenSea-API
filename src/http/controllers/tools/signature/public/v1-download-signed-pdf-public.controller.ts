/**
 * Public download endpoint for the signed PDF — used by signers after they
 * complete their signature on the /sign/:token portal.
 *
 * Authorization: the per-signer access token in the URL. No JWT, no tenant
 * context. The signer can only download the PDF if:
 *   - the access token resolves to a valid signer;
 *   - the signer's access token has not expired;
 *   - the parent envelope is COMPLETED and has a signed file attached.
 *
 * Response is a binary PDF stream (Content-Disposition: attachment).
 */

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

function sanitizeFilename(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\-_. ]+/g, '')
      .trim()
      .slice(0, 120) || 'documento'
  );
}

export async function downloadSignedPdfPublicController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/sign/:token/signed-pdf',
    schema: {
      tags: ['Tools - Digital Signature (Public)'],
      summary: 'Download the signed PDF via signer access token (public)',
      description:
        'Download público do PDF assinado pelo signatário. Requer o access token da URL original de assinatura. Retorna 404 se o envelope ainda não foi concluído.',
      params: z.object({
        token: z.string().min(1).describe('Signer access token'),
      }),
      response: {
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

      if (envelope.status !== 'COMPLETED' || !envelope.signedFileId) {
        return reply
          .status(404)
          .send({ message: 'Signed PDF not yet available for this envelope' });
      }

      const storageFile = await prisma.storageFile.findFirst({
        where: {
          id: envelope.signedFileId,
          tenantId: signer.tenantId.toString(),
          deletedAt: null,
        },
      });

      if (!storageFile) {
        return reply.status(404).send({ message: 'Signed PDF file not found' });
      }

      const fileUploadService = S3FileUploadService.getInstance();
      const buffer = await fileUploadService.getObject(storageFile.fileKey);

      const filename = `${sanitizeFilename(envelope.title)}-assinado.pdf`;

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(buffer);
    },
  });
}
