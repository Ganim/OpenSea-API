import { env } from '@/@env';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyDocumentResponseSchema, idSchema } from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import { LocalFileUploadService } from '@/services/storage/local-file-upload-service';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCompanyDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/companies/:companyId/documents',
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
      summary: 'Upload a company document',
      description:
        'Upload a document as multipart/form-data. Fields: file (required), documentType (required), expiresAt (optional ISO date), notes (optional).',
      consumes: ['multipart/form-data'],
      params: z.object({ companyId: idSchema }),
      response: {
        201: z.object({ document: companyDocumentResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { companyId } = request.params as { companyId: string };

      // Verify company exists and belongs to tenant
      const company = await prisma.company.findFirst({
        where: { id: companyId, tenantId },
      });

      if (!company) {
        return reply.status(400).send({ message: 'Company not found' });
      }

      // Parse multipart fields
      const parts = request.parts();
      let fileBuffer: Buffer | null = null;
      let fileName: string | null = null;
      let mimeType: string | null = null;
      let documentType: string | null = null;
      let expiresAt: string | null = null;
      let notes: string | null = null;

      for await (const part of parts) {
        if (part.type === 'file') {
          fileBuffer = await part.toBuffer();
          fileName = part.filename;
          mimeType = part.mimetype;
        } else {
          // field
          const value = part.value as string;
          switch (part.fieldname) {
            case 'documentType':
              documentType = value;
              break;
            case 'expiresAt':
              expiresAt = value;
              break;
            case 'notes':
              notes = value;
              break;
          }
        }
      }

      if (!fileBuffer || !fileName) {
        return reply.status(400).send({ message: 'File is required' });
      }

      if (!documentType) {
        return reply.status(400).send({ message: 'documentType is required' });
      }

      // Upload file to storage
      const fileUploadService = env.S3_ENDPOINT
        ? S3FileUploadService.getInstance()
        : new LocalFileUploadService();

      const uploadResult = await fileUploadService.upload(
        fileBuffer,
        fileName,
        mimeType || 'application/octet-stream',
        {
          prefix: `company-documents/${tenantId}/${companyId}`,
        },
      );

      // Create database record
      const document = await prisma.companyDocument.create({
        data: {
          tenantId,
          companyId,
          documentType,
          fileName,
          fileKey: uploadResult.key,
          fileSize: uploadResult.size,
          mimeType: mimeType || 'application/octet-stream',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          notes,
          uploadedBy: userId,
        },
      });

      return reply.status(201).send({
        document: {
          id: document.id,
          tenantId: document.tenantId,
          companyId: document.companyId,
          documentType: document.documentType,
          fileName: document.fileName,
          fileKey: document.fileKey,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          expiresAt: document.expiresAt?.toISOString() ?? null,
          notes: document.notes,
          uploadedBy: document.uploadedBy,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
        },
      });
    },
  });
}
