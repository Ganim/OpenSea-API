import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDownloadFileUseCase } from '@/use-cases/storage/files/factories/make-download-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function downloadFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/files/:id/download',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE_FILES.ACCESS,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Files'],
      summary: 'Get a presigned download URL for a file',
      params: z.object({
        id: z.string().uuid(),
      }),
      querystring: z.object({
        version: z.coerce.number().int().positive().optional(),
      }),
      response: {
        200: z.object({
          url: z.string(),
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
      const { version } = request.query;

      try {
        const downloadFileUseCase = makeDownloadFileUseCase();
        const { url, file } = await downloadFileUseCase.execute({
          tenantId,
          fileId: id,
          version,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_DOWNLOAD,
          entityId: file.fileId.toString(),
          placeholders: {
            userName: request.user.sub,
            fileName: file.name,
          },
        });

        return reply.status(200).send({ url });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
