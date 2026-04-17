import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function downloadSignedPdfController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/signature/envelopes/:id/signed-pdf',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.SIGNATURE.ENVELOPES.ACCESS,
        resource: 'signature-envelopes',
      }),
    ],
    schema: {
      tags: ['Tools - Digital Signature'],
      summary: 'Download the signed PDF with certificate page',
      description:
        'Baixa o PDF assinado com a página de certificado de autenticidade (Lei 14.063/2020). Disponível apenas para envelopes COMPLETED com signedFileId definido.',
      params: z.object({
        id: z.string().uuid().describe('Envelope UUID'),
      }),
      response: {
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const envelopesRepository = new PrismaSignatureEnvelopesRepository();
      const envelope = await envelopesRepository.findById(
        new UniqueEntityID(id),
        tenantId,
      );

      if (!envelope) {
        return reply.status(404).send({ message: 'Envelope not found' });
      }

      if (!envelope.signedFileId) {
        return reply
          .status(404)
          .send({ message: 'Signed PDF not yet available for this envelope' });
      }

      const storageFile = await prisma.storageFile.findFirst({
        where: {
          id: envelope.signedFileId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!storageFile) {
        return reply.status(404).send({ message: 'Signed PDF file not found' });
      }

      const fileUploadService = S3FileUploadService.getInstance();
      const buffer = await fileUploadService.getObject(storageFile.fileKey);

      reply.header('Content-Type', storageFile.mimeType);
      reply.header(
        'Content-Disposition',
        `attachment; filename="${storageFile.name}"`,
      );
      return reply.send(buffer);
    },
  });
}
