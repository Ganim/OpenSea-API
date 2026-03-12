import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  companyDocumentResponseSchema,
  idSchema,
  listCompanyDocumentsQuerySchema,
} from '@/http/schemas';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCompanyDocumentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/companies/:companyId/documents',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANIES.READ,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Admin - Company Documents'],
      summary: 'List company documents',
      params: z.object({ companyId: idSchema }),
      querystring: listCompanyDocumentsQuerySchema,
      response: {
        200: z.object({
          documents: z.array(companyDocumentResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            perPage: z.number(),
            totalPages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { companyId } = request.params as { companyId: string };
      const query = request.query as z.infer<
        typeof listCompanyDocumentsQuerySchema
      >;

      const where = {
        tenantId,
        companyId,
        ...(query.documentType
          ? { documentType: query.documentType }
          : undefined),
      };

      const [documents, total] = await Promise.all([
        prisma.companyDocument.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.perPage,
          take: query.perPage,
        }),
        prisma.companyDocument.count({ where }),
      ]);

      return reply.status(200).send({
        documents: documents.map((doc) => ({
          id: doc.id,
          tenantId: doc.tenantId,
          companyId: doc.companyId,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileKey: doc.fileKey,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          expiresAt: doc.expiresAt?.toISOString() ?? null,
          notes: doc.notes,
          uploadedBy: doc.uploadedBy,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
        })),
        meta: {
          total,
          page: query.page,
          perPage: query.perPage,
          totalPages: Math.ceil(total / query.perPage),
        },
      });
    },
  });
}
