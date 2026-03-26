import { verifyAccountant } from '@/http/middlewares/finance/verify-accountant';
import { makeExportSpedUseCase } from '@/use-cases/finance/accountant/factories/make-export-sped-use-case';
import type { SpedFormat } from '@/services/finance/sped-export.service';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function exportSpedController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/accountant/export/sped',
    preHandler: [verifyAccountant],
    schema: {
      tags: ['Accountant Portal'],
      summary: 'Download SPED ECD file',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        year: z.coerce.number().int().min(2000).max(2100),
        format: z.enum(['ECD', 'ECF', 'EFD_CONTRIBUICOES']).default('ECD'),
        startMonth: z.coerce.number().int().min(1).max(12).default(1),
        endMonth: z.coerce.number().int().min(1).max(12).default(12),
      }),
    },
    handler: async (request, reply) => {
      const { year, format, startMonth, endMonth } = request.query as {
        year: number;
        format: SpedFormat;
        startMonth: number;
        endMonth: number;
      };

      const useCase = makeExportSpedUseCase();
      const result = await useCase.execute({
        accessToken: request.headers.authorization!.slice(7),
        year,
        format,
        startMonth,
        endMonth,
      });

      return reply
        .status(200)
        .header('Content-Type', result.mimeType)
        .header(
          'Content-Disposition',
          `attachment; filename="${result.fileName}"`,
        )
        .send(result.data);
    },
  });
}
