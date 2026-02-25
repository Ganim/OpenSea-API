import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFolderResponseSchema } from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeApplyFolderTemplateUseCase } from '@/use-cases/storage/folders/factories/make-apply-folder-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function applyFolderTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/folders/:id/apply-template',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.USER_FOLDERS.CREATE,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Apply a folder structure template to an existing folder',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        templateId: z.string().min(1),
      }),
      response: {
        200: z.object({
          createdFolders: z.array(storageFolderResponseSchema),
          skippedFolders: z.array(z.string()),
        }),
        400: z.object({
          message: z.string(),
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
      const { templateId } = request.body;

      try {
        const applyFolderTemplateUseCase = makeApplyFolderTemplateUseCase();
        const { createdFolders, skippedFolders } =
          await applyFolderTemplateUseCase.execute({
            tenantId,
            targetFolderId: id,
            templateId,
            createdBy: request.user.sub,
          });

        return reply.status(200).send({
          createdFolders: createdFolders.map((folder) =>
            storageFolderToDTO(folder),
          ),
          skippedFolders,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
