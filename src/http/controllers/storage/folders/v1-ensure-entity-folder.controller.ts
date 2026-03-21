import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFolderResponseSchema } from '@/http/schemas/storage';
import { storageFolderToDTO } from '@/mappers/storage';
import { makeCreateEntityFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-create-entity-folders-use-case';
import { makeInitializeTenantFoldersUseCase } from '@/use-cases/storage/auto-creation/factories/make-initialize-tenant-folders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const ensureEntityFolderBodySchema = z.object({
  entityType: z.string().min(1).max(64),
  entityId: z.string().min(1).max(128),
  entityName: z.string().min(1).max(256),
});

export async function ensureEntityFolderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/folders/ensure-entity',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FOLDERS.REGISTER,
        resource: 'storage-folders',
      }),
    ],
    schema: {
      tags: ['Storage - Folders'],
      summary: 'Ensure folders exist for a specific entity',
      description:
        'Initializes tenant system folders if needed, then creates the entity-specific folder structure. If the entity folder already exists, returns successfully without error.',
      body: ensureEntityFolderBodySchema,
      response: {
        201: z.object({
          folders: z.array(storageFolderResponseSchema),
        }),
        200: z.object({
          folders: z.array(storageFolderResponseSchema),
          message: z.string(),
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
      const { entityType, entityId, entityName } = request.body;

      try {
        // Step 1: Ensure tenant system folders exist (idempotent)
        const initializeTenantFoldersUseCase =
          makeInitializeTenantFoldersUseCase();
        await initializeTenantFoldersUseCase.execute({ tenantId });

        // Step 2: Create entity-specific folders
        const createEntityFoldersUseCase = makeCreateEntityFoldersUseCase();
        const { folders } = await createEntityFoldersUseCase.execute({
          tenantId,
          entityType,
          entityId,
          entityName,
        });

        const foldersDTO = folders.map((folder) => storageFolderToDTO(folder));

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FOLDER_ENSURE_ENTITY,
          entityId,
          placeholders: {
            userName: request.user.sub,
            entityType,
            entityName,
          },
          newData: { entityType, entityId, entityName },
        });

        return reply.status(201).send({ folders: foldersDTO });
      } catch (error) {
        if (error instanceof BadRequestError) {
          // If the folder already exists, return 200 with a friendly message
          if (
            error.message.includes('Folder already exists') ||
            error.message.includes('already exists')
          ) {
            return reply.status(200).send({
              folders: [],
              message: 'Entity folder already exists',
            });
          }
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
