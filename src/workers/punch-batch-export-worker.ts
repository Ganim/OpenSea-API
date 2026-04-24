/**
 * Punch batch export worker (Phase 07 / Plan 07-04).
 *
 * Subscreve `QUEUE_NAMES.PUNCH_BATCH_EXPORT` e processa 1 job de export em
 * lote por vez (concurrency 2, limiter 10/s). Formatos:
 *
 *   - CSV / PDF: delega a `makeExportPunch{Csv,Pdf}UseCase` (este plan).
 *   - AFD / AFDT: delega a `makeGenerate{Afd,Afdt}UseCase` (Phase 6). O
 *     worker monta `AfdBuildInput` via o helper `buildAfdDataset` (Phase 6).
 *
 * Fluxo:
 *   1. Idempotency check: `AuditLog` com `action=PUNCH_BATCH_EXPORTED` +
 *      `entityId=jobId`. Se existir, retorna `{ skipped: true }` (replay safe).
 *   2. Dispatch por formato (CSV/PDF/AFD/AFDT).
 *   3. Persist AuditLog (entity=EXPORT_JOB).
 *   4. Dispatch notification `punch.export_ready` (in-app) com `downloadUrl`
 *      + `format` + `period` nos metadados.
 *   5. P2002 em AuditLog.create → `{ skipped: true }` (concurrent race).
 *
 * Gating: `BULLMQ_ENABLED=true` é o interruptor geral (lesson Redis quota
 * exhaustion — Upstash 2026-04-22); gate defensivo aqui mesmo em adição ao
 * `workers/index.ts`.
 */

import type { Job } from 'bullmq';

import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { prisma } from '@/lib/prisma';
import { createWorker, QUEUE_NAMES } from '@/lib/queue';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  notificationClient,
} from '@/modules/notifications/public';
import { buildAfdDataset } from '@/http/controllers/hr/compliance/build-afd-dataset';
import { makeGenerateAfdUseCase } from '@/use-cases/hr/compliance/factories/make-generate-afd';
import { makeGenerateAfdtUseCase } from '@/use-cases/hr/compliance/factories/make-generate-afdt';
import { buildPunchExportDataset } from '@/use-cases/hr/punch/export/build-punch-export-dataset';
import type {
  ExportFormat,
  PunchBatchExportJobData,
} from '@/use-cases/hr/punch/export/dispatch-punch-batch-export';
import { makeExportPunchCsvUseCase } from '@/use-cases/hr/punch/export/factories/make-export-punch-csv';
import { makeExportPunchPdfUseCase } from '@/use-cases/hr/punch/export/factories/make-export-punch-pdf';

// Lazy logger (pattern Plan 04-05 / receipt-pdf-worker).
let _logger: {
  info: (obj: unknown, msg: string) => void;
  warn: (obj: unknown, msg: string) => void;
  error: (obj: unknown, msg: string) => void;
} | null = null;
function getLogger() {
  if (!_logger) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      _logger = require('@/lib/logger').logger;
    } catch {
      _logger = {
        info: (obj, msg) => console.log(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

export interface PunchBatchExportJobResult {
  skipped?: boolean;
  storageKey?: string;
  downloadUrl?: string;
  contentHash?: string;
  sizeBytes?: number;
  jobId?: string;
}

export { type PunchBatchExportJobData };

/**
 * Entry-point chamado pelo orchestrator `workers/index.ts`.
 *
 * Gate `BULLMQ_ENABLED` defensivo (same pattern de todos os workers pós-Upstash
 * 2026-04-22). Quando o flag é `false`, retorna `null` e o worker NÃO abre
 * conexão com Redis.
 */
export function startPunchBatchExportWorker() {
  if (process.env.BULLMQ_ENABLED !== 'true') {
    return null;
  }
  return createWorker<PunchBatchExportJobData>(
    QUEUE_NAMES.PUNCH_BATCH_EXPORT,
    async (
      job: Job<PunchBatchExportJobData>,
    ): Promise<PunchBatchExportJobResult> => {
      return processPunchBatchExportJob(job.data);
    },
    {
      // PDFs de 10k+ rows + AFDs podem levar 10-30s por job; mantemos
      // concurrency baixa para não estourar memory do runtime (pdfkit keeps
      // the whole buffer in RAM until `doc.end()`).
      concurrency: 2,
      limiter: { max: 10, duration: 1000 },
    },
  );
}

/**
 * Job processor — exported para unit test com vi.hoisted + vi.mock.
 */
export async function processPunchBatchExportJob(
  data: PunchBatchExportJobData,
): Promise<PunchBatchExportJobResult> {
  // ── 1. Idempotency check ─────────────────────────────────────────────────
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId: data.tenantId,
      action: 'PUNCH_BATCH_EXPORTED',
      entityId: data.jobId,
    },
    select: { id: true },
  });
  if (existing) {
    getLogger().info(
      { jobId: data.jobId, tenantId: data.tenantId },
      '[punchBatchExportWorker] skipped: already exported',
    );
    return { skipped: true };
  }

  const startDate = new Date(data.filters.startDate);
  const endDate = new Date(data.filters.endDate);

  // ── 2. Dispatch por formato ─────────────────────────────────────────────
  let result: {
    jobId: string;
    storageKey: string;
    downloadUrl: string;
    contentHash: string;
    sizeBytes: number;
  };
  let rowCount: number;

  if (data.format === 'CSV' || data.format === 'PDF') {
    const dataset = await buildPunchExportDataset({
      prisma,
      tenantId: data.tenantId,
      startDate,
      endDate,
      employeeIds: data.filters.employeeIds,
      departmentIds: data.filters.departmentIds,
    });
    rowCount = dataset.rows.length;
    const useCase =
      data.format === 'CSV'
        ? makeExportPunchCsvUseCase()
        : makeExportPunchPdfUseCase();
    result = await useCase.execute({
      tenantId: data.tenantId,
      generatedBy: data.generatedBy,
      jobId: data.jobId,
      dataset,
    });
  } else {
    // AFD / AFDT — reusa o builder Phase 6 (byte-perfect ISO-8859-1 + CRLF + CRC).
    const afdDataset = await buildAfdDataset({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma: prisma as any,
      tenantId: data.tenantId,
      startDate,
      endDate,
      cnpj: data.filters.cnpj,
      departmentIds: data.filters.departmentIds,
    });
    rowCount = afdDataset.marcacoes.length;

    const useCase =
      data.format === 'AFD'
        ? makeGenerateAfdUseCase()
        : makeGenerateAfdtUseCase();

    const afdResult = await useCase.execute({
      tenantId: data.tenantId,
      generatedBy: data.generatedBy,
      startDate,
      endDate,
      cnpj: data.filters.cnpj,
      departmentIds: data.filters.departmentIds,
      dataset: afdDataset,
    });

    // Adapta o shape do response AFD (artifactId) para o shape comum do export
    // (jobId). O `jobId` do AuditLog/Notification permanece o `data.jobId`.
    result = {
      jobId: data.jobId,
      storageKey: afdResult.storageKey,
      downloadUrl: afdResult.downloadUrl,
      contentHash: afdResult.contentHash,
      sizeBytes: afdResult.sizeBytes,
    };
  }

  // ── 3. AuditLog ──────────────────────────────────────────────────────────
  //
  // Worker é fora do ciclo de request, logo não temos Fastify context e não
  // podemos usar `logAudit(request, ...)`. Grava direto via Prisma com o
  // mesmo shape do audit.helper (action/entity/module + description com
  // placeholders resolvidos + newData com contexto extra).
  const auditMsg = AUDIT_MESSAGES.HR.PUNCH_BATCH_EXPORTED;
  const placeholders: Record<string, string> = {
    userName: data.generatedBy,
    format: data.format,
    period: `${data.filters.startDate}..${data.filters.endDate}`,
    count: String(rowCount),
  };
  const description = auditMsg.description.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => placeholders[key] ?? match,
  );

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.generatedBy,
        action: auditMsg.action,
        entity: auditMsg.entity,
        module: auditMsg.module,
        entityId: data.jobId,
        description,
        newData: {
          format: data.format,
          storageKey: result.storageKey,
          contentHash: result.contentHash,
          sizeBytes: result.sizeBytes,
          rowCount,
          _placeholders: placeholders,
        },
      },
    });
  } catch (err) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? (err as { code?: string }).code
        : undefined;
    if (code === 'P2002') {
      getLogger().info(
        { jobId: data.jobId, tenantId: data.tenantId },
        '[punchBatchExportWorker] skipped: UNIQUE audit race',
      );
      return { skipped: true };
    }
    throw err;
  }

  // ── 4. Notificação in-app ────────────────────────────────────────────────
  //
  // Categoria `punch.export_ready` declarada no manifest (Plan 01). Em caso
  // de falha do dispatcher de notificação (NotificationClient não
  // inicializado em contexto de smoke test), logamos e seguimos — o artifact
  // já está no R2 e o audit gravado, então o operador pode recuperar via
  // listagem de artefatos.
  try {
    await notificationClient.dispatch({
      tenantId: data.tenantId,
      category: 'punch.export_ready',
      type: NotificationType.INFORMATIONAL,
      priority: NotificationPriority.NORMAL,
      channels: [NotificationChannel.IN_APP],
      recipients: { userIds: [data.generatedBy] },
      title: 'Exportação de ponto concluída',
      body: `Seu arquivo ${data.format} está pronto para download.`,
      entity: { type: 'EXPORT_JOB', id: data.jobId },
      metadata: {
        downloadUrl: result.downloadUrl,
        format: data.format,
        period: `${data.filters.startDate}..${data.filters.endDate}`,
        rowCount,
      },
      idempotencyKey: `punch.export:${data.jobId}:complete`,
    });
  } catch (err) {
    getLogger().error(
      {
        jobId: data.jobId,
        tenantId: data.tenantId,
        err: err instanceof Error ? err.message : String(err),
      },
      '[punchBatchExportWorker] notification dispatch failed — artifact is still uploaded',
    );
  }

  getLogger().info(
    {
      jobId: data.jobId,
      tenantId: data.tenantId,
      format: data.format,
      storageKey: result.storageKey,
      rowCount,
    },
    '[punchBatchExportWorker] export concluído',
  );

  return {
    skipped: false,
    jobId: data.jobId,
    storageKey: result.storageKey,
    downloadUrl: result.downloadUrl,
    contentHash: result.contentHash,
    sizeBytes: result.sizeBytes,
  };
}

// Re-export ExportFormat para consumers (tests).
export type { ExportFormat };
