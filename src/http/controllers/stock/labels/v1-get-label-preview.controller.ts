import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { labelPreviewResponseSchema } from '@/http/schemas';
import { makeGetLabelPreviewUseCase } from '@/use-cases/stock/labels/factories/make-get-label-preview-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getLabelPreviewController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/labels/preview/:binId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.BINS.READ,
        resource: 'labels',
      }),
    ],
    schema: {
      tags: ['Stock - Labels'],
      summary: 'Get label preview for a bin',
      description: 'Returns preview data for a single bin label.',
      params: z.object({
        binId: z.string().uuid(),
      }),
      response: {
        200: labelPreviewResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { binId } = request.params;

      try {
        const getLabelPreviewUseCase = makeGetLabelPreviewUseCase();
        const result = await getLabelPreviewUseCase.execute({ binId });

        return reply.status(200).send(result.preview);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
