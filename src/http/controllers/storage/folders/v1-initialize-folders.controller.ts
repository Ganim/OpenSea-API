import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFolderResponseSchema } from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeInitializeTenantFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-initialize-tenant-folders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function initializeFoldersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/folders/initialize',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FILES.ACCESS,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Initialize system folders for the current tenant',
      description:
        'Creates the default folder structure for the tenant. This operation is idempotent - folders that already exist will be skipped.',
      response: {
        201: z.object({
          folders: z.array(storageFolderResponseSchema),
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const initializeTenantFoldersUseCase =
        makeInitializeTenantFoldersUseCase();
      const { folders } = await initializeTenantFoldersUseCase.execute({
        tenantId,
      });

      const foldersDTO = folders.map((folder) => storageFolderToDTO(folder));

      await logAudit(request, {
        message: AUDIT_MESSAGES.STORAGE.FOLDER_INITIALIZE,
        entityId: tenantId,
        placeholders: {
          userName: request.user.sub,
          folderCount: String(folders.length),
        },
        newData: { folderCount: folders.length },
      });

      return reply.status(201).send({
        folders: foldersDTO,
        message: 'Folders initialized successfully',
      });
    },
  });
}
