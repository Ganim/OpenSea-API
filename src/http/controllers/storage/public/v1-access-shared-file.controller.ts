import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeAccessSharedFileUseCase } from '@/use-cases/storage/sharing/factories/make-access-shared-file-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function accessSharedFileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/public/shared/:token',
    schema: {
      tags: ['Storage - Public Sharing'],
      summary: 'Access a shared file via public link',
      params: z.object({
        token: z.string().min(32),
      }),
      querystring: z.object({
        password: z.string().optional(),
      }),
      response: {
        200: z.object({
          file: z.object({
            name: z.string(),
            size: z.number(),
            mimeType: z.string(),
            fileType: z.string(),
          }),
          link: z.object({
            expiresAt: z.coerce.date().nullable(),
            downloadCount: z.number(),
            maxDownloads: z.number().nullable(),
          }),
        }),
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
      const { password } = request.query;

      try {
        const accessSharedFileUseCase = makeAccessSharedFileUseCase();
        const { file, shareLink } = await accessSharedFileUseCase.execute({
          token,
          password,
        });

        return reply.status(200).send({
          file: {
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
            fileType: file.fileType,
          },
          link: {
            expiresAt: shareLink.expiresAt,
            downloadCount: shareLink.downloadCount,
            maxDownloads: shareLink.maxDownloads,
          },
        });
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
