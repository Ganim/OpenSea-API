/**
 * Protected file preview endpoint — POST with fileId in body
 * IDM/download managers intercept GET requests with file-like URLs.
 * This POST endpoint serves the same file bytes but is invisible to IDM
 * since download managers don't intercept POST requests with JSON body.
 */

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeServeFileUseCase } from '@/use-cases/storage/files/factories/make-serve-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function previewFileProtectedController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/preview',
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
      summary: 'Preview file content (IDM-safe)',
      description:
        'POST endpoint that serves file bytes. Uses JSON body instead of URL params to avoid interception by download managers like IDM.',
      body: z.object({
        fileId: z.string().uuid(),
        format: z.enum(['pdf']).optional(),
        password: z.string().optional(),
      }),
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { fileId, format, password } = request.body;

      try {
        const serveFileUseCase = makeServeFileUseCase();
        const result = await serveFileUseCase.execute({
          tenantId,
          fileId,
          password,
          format,
        });

        // Return as base64 inside JSON — IDM never intercepts JSON responses
        const base64 = Buffer.from(result.buffer).toString('base64');
        return reply
          .header('Content-Type', 'application/json')
          .header('Cache-Control', 'no-store')
          .send({
            data: base64,
            mimeType: result.mimeType,
            fileName: result.fileName,
            size: result.size,
          });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
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
