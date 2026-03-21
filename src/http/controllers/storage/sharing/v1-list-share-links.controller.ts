import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageShareLinkToDTO } from '@/mappers/storage';
import { makeListShareLinksUseCase } from '@/use-cases/storage/sharing/factories/make-list-share-links-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listShareLinksController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/files/:fileId/shares',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Sharing'],
      summary: 'List all share links for a file',
      params: z.object({
        fileId: z.string().uuid(),
      }),
      response: {
        200: z.array(
          z.object({
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
        ),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileId } = request.params;

      try {
        const listShareLinksUseCase = makeListShareLinksUseCase();
        const { shareLinks } = await listShareLinksUseCase.execute({
          tenantId,
          fileId,
        });

        return reply.status(200).send(shareLinks.map(storageShareLinkToDTO));
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
