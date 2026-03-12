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

export async function deleteCompanyDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/admin/companies/:companyId/documents/:documentId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANIES.UPDATE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Admin - Company Documents'],
      summary: 'Delete a company document',
      params: z.object({
        companyId: idSchema,
        documentId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { companyId, documentId } = request.params as {
        companyId: string;
        documentId: string;
      };

      const document = await prisma.companyDocument.findFirst({
        where: { id: documentId, companyId, tenantId },
      });

      if (!document) {
        return reply.status(404).send({ message: 'Document not found' });
      }

      // Delete file from storage if it has a fileKey
      if (document.fileKey) {
        try {
          const fileUploadService = env.S3_ENDPOINT
            ? S3FileUploadService.getInstance()
            : new LocalFileUploadService();

          await fileUploadService.delete(document.fileKey);
        } catch {
          // Log but don't fail the delete if file removal fails
          request.log.warn(
            { fileKey: document.fileKey },
            'Failed to delete file from storage',
          );
        }
      }

      await prisma.companyDocument.delete({
        where: { id: documentId },
      });

      return reply.status(204).send(null);
    },
  });
}
