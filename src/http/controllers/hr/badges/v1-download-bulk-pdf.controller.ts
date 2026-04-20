import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { downloadBulkPdfParamsSchema } from '@/http/schemas/hr/badge/generate-bulk-badge-pdfs.schema';
import { redis } from '@/lib/redis';

/**
 * GET /v1/hr/qr-tokens/bulk-pdf/:jobId/download
 *
 * Local download endpoint used by the Redis fallback path of the
 * {@link badgePdfWorker}. When S3 is not configured (dev environments or
 * transient S3 outage), the worker stores the rendered PDF in Redis under
 * `badge-pdf:{jobId}` with a 24h TTL and returns this URL. In production,
 * S3 pre-signed URLs bypass this endpoint entirely.
 *
 * Permissão: hr.crachas.print (Phase 5 addition).
 *
 * Note per Phish-01 mitigation: ownership verification of `jobId` against
 * the initiator is deferred to a future plan — the 24h TTL + RBAC gate is
 * the current mitigation. If abuse is observed, attach `invokedByUserId`
 * to the Redis payload and compare against `request.user.sub`.
 */
export async function v1DownloadBulkPdfController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/qr-tokens/bulk-pdf/:jobId/download',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.CRACHAS.PRINT,
        resource: 'hr-crachas',
      }),
    ],
    schema: {
      tags: ['HR - Crachás'],
      summary: 'Baixa o lote de crachás PDF (fallback Redis)',
      description:
        'Endpoint interno — usado apenas quando o worker armazena o PDF em Redis (S3 não configurado). Em produção, o admin recebe URL S3 pré-assinada de 24h diretamente.',
      params: downloadBulkPdfParamsSchema,
      response: {
        404: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { jobId } = request.params;

      // ioredis returns Buffer when we pass `getBuffer`; using `get` returns
      // a string (binary-safe encoding may corrupt the PDF on some setups).
      const pdf = await redis.client.getBuffer(`badge-pdf:${jobId}`);
      if (!pdf || pdf.length === 0) {
        return reply
          .status(404)
          .send({ message: 'Lote não encontrado ou expirado' });
      }

      return reply
        .status(200)
        .type('application/pdf')
        .header(
          'Content-Disposition',
          `attachment; filename="crachas-lote-${jobId}.pdf"`,
        )
        .send(pdf);
    },
  });
}
