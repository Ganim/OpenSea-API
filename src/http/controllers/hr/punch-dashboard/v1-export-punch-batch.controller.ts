import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  exportPunchBatchBodySchema,
  exportPunchBatchResponseSchema,
} from '@/http/schemas/hr/punch/punch-export.schema';
import { prisma } from '@/lib/prisma';
import { makeDispatchPunchBatchExportUseCase } from '@/use-cases/hr/punch/export/factories/make-dispatch-punch-batch-export';

/**
 * POST /v1/hr/punch/exports
 *
 * Export em lote multi-formato (D-11). Body:
 *   - format: CSV | PDF | AFD | AFDT
 *   - startDate / endDate: YYYY-MM-DD (máx 365 dias)
 *   - employeeIds / departmentIds / cnpj / separator (opcionais)
 *
 * Comportamento:
 *   - CSV < 10k rows → 200 + artifact response (dispatcher executa inline).
 *   - PDF < 3k rows  → 200 + artifact response.
 *   - CSV ≥ 10k / PDF ≥ 3k / AFD / AFDT → 202 + jobId (BullMQ worker processa).
 *
 * Permissão (OR): `hr.time-control.export` OU `hr.punch-approvals.admin`.
 *
 * Audit:
 *   - Sync path: `PUNCH_BATCH_EXPORTED` gravado no controller (aqui).
 *   - Async path: `PUNCH_BATCH_EXPORTED` gravado no worker ao concluir.
 *
 * LGPD: o dataset builder NUNCA inclui CPF. Teste E2E valida
 *       `expect(body).not.toContain('cpf')`.
 */
export async function v1ExportPunchBatchController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/punch/exports',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createAnyPermissionMiddleware([
        PermissionCodes.HR.TIME_CONTROL.EXPORT,
        PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
      ]),
    ],
    schema: {
      tags: ['HR - Punch Dashboard'],
      summary: 'Exportar batidas em lote (CSV/PDF/AFD/AFDT)',
      description:
        'Gera artefato de batidas no formato solicitado. CSV < 10k rows e PDF < 3k rows são processados síncronos (resposta 200 com downloadUrl R2 presigned 15min). AFD/AFDT e volumes maiores são enfileirados via BullMQ (202 + jobId; notificação punch.export_ready ao concluir).',
      body: exportPunchBatchBodySchema,
      response: {
        200: exportPunchBatchResponseSchema,
        202: exportPunchBatchResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const generatedBy = request.user.sub;
      const body = request.body;

      try {
        const useCase = makeDispatchPunchBatchExportUseCase();
        const result = await useCase.execute({
          tenantId,
          generatedBy,
          format: body.format,
          filters: {
            startDate: new Date(`${body.startDate}T00:00:00.000Z`),
            endDate: new Date(`${body.endDate}T23:59:59.999Z`),
            employeeIds: body.employeeIds,
            departmentIds: body.departmentIds,
            cnpj: body.cnpj,
          },
          prisma,
        });

        if (result.mode === 'sync') {
          // Sync path: grava audit inline (worker grava no async path).
          const rowCount = await prisma.timeEntry.count({
            where: {
              tenantId,
              timestamp: {
                gte: new Date(`${body.startDate}T00:00:00.000Z`),
                lte: new Date(`${body.endDate}T23:59:59.999Z`),
              },
              ...(body.employeeIds?.length
                ? { employeeId: { in: body.employeeIds } }
                : {}),
              ...(body.departmentIds?.length
                ? {
                    employee: { departmentId: { in: body.departmentIds } },
                  }
                : {}),
            },
          });

          await logAudit(request, {
            message: AUDIT_MESSAGES.HR.PUNCH_BATCH_EXPORTED,
            entityId: result.response.jobId,
            placeholders: {
              userName: generatedBy,
              format: body.format,
              period: `${body.startDate}..${body.endDate}`,
              count: String(rowCount),
            },
            newData: {
              format: body.format,
              storageKey: result.response.storageKey,
              contentHash: result.response.contentHash,
              sizeBytes: result.response.sizeBytes,
              mode: 'sync',
              rowCount,
            },
          });

          return reply.status(200).send(result);
        }

        // Async path — worker grava audit e dispatcha notification ao concluir.
        return reply.status(202).send({
          mode: 'async' as const,
          jobId: result.jobId,
          message:
            'Exportação em processamento. Você receberá uma notificação quando o arquivo estiver pronto.',
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
