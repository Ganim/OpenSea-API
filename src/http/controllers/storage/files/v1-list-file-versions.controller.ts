import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storageFileVersionResponseSchema } from '@/http/schemas/storage';
import { storageFileVersionToDTO } from '@/mappers/storage';
import { makeListFileVersionsUseCase } from '@/use-cases/storage/files/factories/make-list-file-versions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listFileVersionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/files/:id/versions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
        resource: 'storage-file-versions',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'List all versions of a file',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          versions: z.array(storageFileVersionResponseSchema),
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
        const listFileVersionsUseCase = makeListFileVersionsUseCase();
        const { versions } = await listFileVersionsUseCase.execute({
          tenantId,
          fileId: id,
        });

        return reply.status(200).send({
          versions: versions.map(storageFileVersionToDTO),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
