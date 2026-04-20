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
  rotateBulkBodySchema,
  rotateBulkResponseSchema,
} from '@/http/schemas/hr/qr-token/rotate-bulk.schema';
import { makeRotateQrTokensBulkUseCase } from '@/use-cases/hr/qr-tokens/factories/make-rotate-qr-tokens-bulk';

/**
 * POST /v1/hr/qr-tokens/rotate-bulk
 *
 * Asynchronous bulk QR rotation (D-14 bulk). Returns a `jobId` + `total`.
 * The heavy lifting happens in `qrBatchWorker` which progresses the job in
 * chunks of 100 employees and emits Socket.IO progress events to the
 * `tenant:{id}:hr` room.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1RotateQrTokensBulkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/qr-tokens/rotate-bulk',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.ADMIN,
        resource: 'hr-qr-tokens',
      }),
    ],
    schema: {
      tags: ['HR - QR Tokens'],
      summary: 'Rotaciona QRs em massa (job BullMQ)',
      description:
        'Enfileira um job BullMQ na fila `qr-batch-operations`. Progresso é emitido via Socket.IO para a sala `tenant:{id}:hr` (event `punch.qr_rotation.progress`). Ao concluir, publica `punch.qr.rotation.completed` e (opcionalmente) dispara um sub-job `BADGE_PDF`.',
      body: rotateBulkBodySchema,
      response: {
        202: rotateBulkResponseSchema,
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeRotateQrTokensBulkUseCase();
      const result = await useCase.execute({
        tenantId,
        scope: request.body.scope,
        employeeIds: request.body.employeeIds,
        departmentIds: request.body.departmentIds,
        generatePdfs: request.body.generatePdfs,
        invokedByUserId: userId,
      });

      // Audit the admin-initiated bulk request. The real rotation count is
      // logged per-employee by the worker (via PUNCH_EVENTS.QR_ROTATED
      // downstream in Phase 6/7 consumers); here we just record the
      // triggering action.
      await logAudit(request, {
        message: AUDIT_MESSAGES.HR.PUNCH_QR_TOKEN_ROTATED,
        entityId: result.jobId ?? 'no-op',
        placeholders: {
          userName: userId,
          employeeName: `bulk(${result.total})`,
        },
      });

      return reply.status(202).send(result);
    },
  });
}
