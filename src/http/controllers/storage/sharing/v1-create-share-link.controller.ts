import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageShareLinkToDTO } from '@/mappers/storage';
import { makeCreateShareLinkUseCase } from '@/use-cases/storage/sharing/factories/make-create-share-link-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createShareLinkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/files/:fileId/share',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.MODIFY,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Sharing'],
      summary: 'Create a public share link for a file',
      params: z.object({
        fileId: z.string().uuid(),
      }),
      body: z.object({
        expiresAt: z.coerce.date().optional(),
        password: z.string().min(4).max(128).optional(),
        maxDownloads: z.number().int().positive().optional(),
      }),
      response: {
        201: z.object({
          id: z.string(),
          tenantId: z.string(),
          fileId: z.string(),
          token: z.string(),
          expiresAt: z.coerce.date().nullable(),
          maxDownloads: z.number().nullable(),
          downloadCount: z.number(),
          isActive: z.boolean(),
          createdBy: z.string(),
          createdAt: z.coerce.date(),
          updatedAt: z.coerce.date(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileId } = request.params;
      const { expiresAt, password, maxDownloads } = request.body;

      try {
        const createShareLinkUseCase = makeCreateShareLinkUseCase();
        const { shareLink } = await createShareLinkUseCase.execute({
          tenantId,
          fileId,
          createdBy: request.user.sub,
          expiresAt,
          password,
          maxDownloads,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.SHARE_LINK_CREATED,
          entityId: shareLink.shareLinkId.toString(),
          placeholders: {
            userName: request.user.sub,
            fileName: fileId,
          },
        });

        return reply.status(201).send(storageShareLinkToDTO(shareLink));
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
