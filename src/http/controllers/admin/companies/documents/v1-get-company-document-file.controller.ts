import { env } from '@/@env';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getCompanyDocumentFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/companies/:companyId/documents/:documentId/file',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANIES.ACCESS,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Admin - Company Documents'],
      summary: 'Download/view a company document file',
      params: z.object({
        companyId: idSchema,
        documentId: idSchema,
      }),
      querystring: z.object({
        download: z.enum(['true', 'false']).optional().default('false'),
      }),
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { companyId, documentId } = request.params as {
        companyId: string;
        documentId: string;
      };
      const { download } = request.query as { download: string };

      const document = await prisma.companyDocument.findFirst({
        where: { id: documentId, companyId, tenantId },
      });

      if (!document) {
        return reply.status(404).send({ message: 'Document not found' });
      }

      if (!document.fileKey) {
        return reply
          .status(404)
          .send({ message: 'Document has no associated file' });
      }

      const fileUploadService = env.S3_ENDPOINT
        ? S3FileUploadService.getInstance()
        : new LocalFileUploadService();

      const fileBuffer = await fileUploadService.getObject(document.fileKey);

      const contentDisposition =
        download === 'true'
          ? `attachment; filename="${document.fileName || 'document'}"`
          : `inline; filename="${document.fileName || 'document'}"`;

      return reply
        .status(200)
        .header('Content-Type', document.mimeType || 'application/octet-stream')
        .header('Content-Disposition', contentDisposition)
        .header('Content-Length', fileBuffer.length)
        .send(fileBuffer);
    },
  });
}
