import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDownloadSharedFileUseCase } from '@/use-cases/storage/sharing/factories/make-download-shared-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function downloadSharedFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/public/shared/:token/download',
    schema: {
      tags: ['Storage - Public Sharing'],
      summary: 'Download a shared file via public link',
      params: z.object({
        token: z.string().min(1),
      }),
      body: z
        .object({
          password: z.string().optional(),
        })
        .optional(),
      response: {
        200: z.any().describe('File binary content'),
        403: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;
      const password = request.body?.password;

      try {
        const downloadSharedFileUseCase = makeDownloadSharedFileUseCase();
        const result = await downloadSharedFileUseCase.execute({
          token,
          password,
        });

        return reply
          .header('Content-Type', result.mimeType)
          .header(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(result.fileName)}"`,
          )
          .header('Content-Length', result.size)
          .header('X-Content-Type-Options', 'nosniff')
          .send(result.buffer);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
