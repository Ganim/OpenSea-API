import { makeRecordViewUseCase } from '@/use-cases/sales/tracking/factories/make-record-view-use-case';
import type { TrackableEntityType } from '@/use-cases/sales/tracking/record-view';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const TRANSPARENT_GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

export async function trackingPixelController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/tracking/:type/:id/pixel.gif',
    schema: {
      tags: ['Sales - Tracking'],
      summary:
        'Tracking pixel for quote/proposal view tracking (public, no auth)',
      params: z.object({
        type: z.enum(['quote', 'proposal']),
        id: z.string().uuid(),
      }),
      response: {
        200: z.any(),
      },
    },

    handler: async (request, reply) => {
      const { type, id } = request.params as {
        type: TrackableEntityType;
        id: string;
      };

      try {
        const useCase = makeRecordViewUseCase();
        await useCase.execute({ entityType: type, entityId: id });
      } catch {
        // Silently fail — tracking should never break the pixel response
      }

      return reply
        .status(200)
        .header('Content-Type', 'image/gif')
        .header(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        )
        .header('Pragma', 'no-cache')
        .header('Expires', '0')
        .send(TRANSPARENT_GIF_BUFFER);
    },
  });
}
