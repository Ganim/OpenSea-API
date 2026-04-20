import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  generateBulkBadgePdfsBodySchema,
  generateBulkBadgePdfsResponseSchema,
} from '@/http/schemas/hr/badge/generate-bulk-badge-pdfs.schema';
import { makeGenerateBulkBadgePdfsUseCase } from '@/use-cases/hr/badges/factories/make-generate-bulk-badge-pdfs';

/**
 * POST /v1/hr/qr-tokens/bulk-pdf
 *
 * Asynchronous bulk crachá PDF generation (D-13). Returns `202 { jobId,
 * total }`. The heavy lifting happens in `badgePdfWorker` on the BullMQ
 * queue `QUEUE_NAMES.BADGE_PDF`: it rotates every employee's QR token
 * inline, renders an A4 2×4 lote PDF, uploads to S3 (or Redis fallback),
 * and publishes `PUNCH_EVENTS.QR_ROTATION_COMPLETED` with the
 * `bulkPdfDownloadUrl` so the Plan 05-02 consumer delivers the
 * "lote pronto" notification.
 *
 * Permissão: hr.crachas.print (Phase 5 addition).
 */
export async function v1GenerateBulkBadgePdfsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/qr-tokens/bulk-pdf',
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
      summary: 'Gera crachás em lote (A4 2×4) — job BullMQ',
      description:
        'Enfileira um job BullMQ na fila `badge-pdf-generation`. O worker rotaciona cada QR inline, renderiza PDF A4 (8 crachás/página com marcas de corte tracejadas) e faz upload ao S3 com URL assinada de 24h (fallback Redis em dev). Emite `punch.qr.rotation.completed` com `bulkPdfDownloadUrl` para o consumer de notificações (Plan 05-02).',
      body: generateBulkBadgePdfsBodySchema,
      response: {
        202: generateBulkBadgePdfsResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeGenerateBulkBadgePdfsUseCase();
      const result = await useCase.execute({
        tenantId,
        scope: request.body.scope,
        employeeIds: request.body.employeeIds,
        departmentIds: request.body.departmentIds,
        invokedByUserId: userId,
      });

      // Audit the admin-initiated bulk request. The real per-employee
      // rotation is audited downstream by the worker (Phase 6/7 consumers).
      await logAudit(request, {
        message: AUDIT_MESSAGES.HR.PUNCH_QR_TOKEN_ROTATED,
        entityId: result.jobId ?? 'no-op',
        placeholders: {
          userName: userId,
          employeeName: `bulk-badge-pdf(${result.total})`,
        },
      });

      return reply.status(202).send(result);
    },
  });
}
