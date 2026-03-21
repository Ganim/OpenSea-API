import { PermissionCodes } from '@/constants/rbac';
import { USER_FOLDER_TEMPLATES } from '@/constants/storage/folder-templates';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listFolderTemplatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/folder-templates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FOLDERS.ACCESS,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'List available folder structure templates',
      response: {
        200: z.object({
          templates: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string(),
              folders: z.array(
                z.object({
                  name: z.string(),
                  icon: z.string(),
                }),
              ),
            }),
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const templates = USER_FOLDER_TEMPLATES.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        folders: template.folders.map((folder) => ({
          name: folder.name,
          icon: folder.icon,
        })),
      }));

      return reply.status(200).send({ templates });
    },
  });
}
