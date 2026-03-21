import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  storageFileResponseSchema,
  storageFileVersionResponseSchema,
} from '@/http/schemas/storage';
import { storageFileToDTO, storageFileVersionToDTO } from '@/mappers/storage';
import { makeGetFileUseCase } from '@/use-cases/storage/files/factories/make-get-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/files/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.ACCESS,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Get a file by ID with all its versions',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          file: storageFileResponseSchema,
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
        const getFileUseCase = makeGetFileUseCase();
        const { file, versions } = await getFileUseCase.execute({
          tenantId,
          fileId: id,
        });

        return reply.status(200).send({
          file: storageFileToDTO(file),
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
