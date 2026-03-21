import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetFolderBreadcrumbUseCase } from '@/use-cases/storage/folders/factories/make-get-folder-breadcrumb-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBreadcrumbController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/folders/:id/breadcrumb',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Get folder breadcrumb path from root',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          breadcrumb: z.array(
            z.object({
              id: z.string().uuid(),
              name: z.string(),
              path: z.string(),
            }),
          ),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const getFolderBreadcrumbUseCase = makeGetFolderBreadcrumbUseCase();
        const { breadcrumb } = await getFolderBreadcrumbUseCase.execute({
          tenantId,
          folderId: id,
        });

        return reply.status(200).send({ breadcrumb });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
