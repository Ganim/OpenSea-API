import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeServeFileUseCase } from '@/use-cases/storage/files/factories/make-serve-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function serveFileController(app: FastifyInstance) {
  // Hook: extract ?token= query param and set as Authorization header
  // Needed for <iframe>, <video>, <img> src which cannot send custom headers
  app.addHook('preHandler', async (request) => {
    const token = (request.query as Record<string, string>).token;
    if (token && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${token}`;
    }
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/storage/files/:id/serve',
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
      summary: 'Serve file content through backend proxy',
      description:
        'Streams file bytes through the backend, eliminating direct S3 URL exposure. Supports ?download=1 for forced download and ?version=N for specific versions. Authentication via Authorization header or ?token= query param.',
      params: z.object({
        id: z.string().uuid(),
      }),
      querystring: z.object({
        version: z.coerce.number().int().positive().optional(),
        download: z.coerce.number().optional(),
        token: z.string().optional(),
        password: z.string().optional(),
        format: z.enum(['pdf']).optional(),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { version, download, password, format } = request.query;

      try {
        const serveFileUseCase = makeServeFileUseCase();
        const result = await serveFileUseCase.execute({
          tenantId,
          fileId: id,
          version,
          password,
          format,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.FILE_ACCESS,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            fileName: result.fileName,
          },
        });

        const disposition =
          download === 1
            ? `attachment; filename="${encodeURIComponent(result.fileName)}"`
            : `inline; filename="${encodeURIComponent(result.fileName)}"`;

        return reply
          .header('Content-Type', result.mimeType)
          .header('Content-Disposition', disposition)
          .header('Content-Length', result.size)
          .header('Cache-Control', 'private, max-age=300')
          .header('X-Content-Type-Options', 'nosniff')
          .send(result.buffer);
      } catch (error) {
        if (error instanceof BadRequestError) {
          // PROTECTED = needs password, INVALID_PASSWORD = wrong password
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        // Office→PDF conversion failed (e.g. LibreOffice not installed)
        if (format === 'pdf' && error instanceof Error) {
          return reply
            .status(422)
            .send({ message: 'CONVERSION_UNAVAILABLE', detail: error.message });
        }
        throw error;
      }
    },
  });
}
