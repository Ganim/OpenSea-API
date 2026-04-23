/**
 * folha-espelho-bulk-worker.ts — Phase 06 / Plan 06-04 Task 2
 *
 * BullMQ worker para `QUEUE_NAMES.FOLHA_ESPELHO_BULK`. Processa 1 job com
 * `employeeIds[]` em chunks de 20 usando `Promise.allSettled` (erros em 1
 * funcionário não abortam o lote inteiro). Após cada chunk, emite evento
 * Socket.IO `compliance.folha_espelho.progress` na room tenant-scoped
 * `tenant:{id}:hr`. Ao final, emite `compliance.folha_espelho.completed`.
 *
 * **Canonical pattern:** replica estrutura de `receipt-pdf-worker` (Plan
 * 06-03) e `badge-pdf-worker` (Plan 05-06):
 *   - `createWorker<JobData>(QUEUE, handler, opts)` do `@/lib/queue`
 *   - Lazy logger (`@/lib/logger` require-time)
 *   - Socket.IO via `@/lib/websocket/socket-server.getSocketServer()` (defensivo)
 *   - Gated por `BULLMQ_ENABLED` no `workers/index.ts` (lesson Upstash)
 *
 * **Geração individual:** delegada ao `GenerateFolhaEspelhoUseCase` via
 * factory (`makeGenerateFolhaEspelhoUseCase`). O worker NÃO duplica a lógica
 * de consolidação/renderização — é um orquestrador de chunks.
 *
 * **Resiliência:** erros de 1 funcionário são capturados no `Promise.allSettled`
 * como `rejected` e incrementam `failed` no progress; o contador `success` só
 * incrementa em casos `fulfilled`. O RH vê `total/success/failed` em tempo real.
 *
 * **tenantContext para o use case:** o worker precisa resolver Tenant +
 * EsocialConfig uma vez por job (não por funcionário) para não hitar o DB
 * 500× por job. Cache em memória local ao job.
 */

import type { Job } from 'bullmq';

import { env } from '@/@env';
import { prisma } from '@/lib/prisma';
import { createWorker, QUEUE_NAMES } from '@/lib/queue';
import { makeGenerateFolhaEspelhoUseCase } from '@/use-cases/hr/compliance/factories/make-generate-folha-espelho';
import type { FolhaEspelhoBulkJobData } from '@/use-cases/hr/compliance/generate-folha-espelho-bulk';

// Lazy logger (pattern canônico Phase 04/05/06)
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

const CHUNK_SIZE = 20;

export interface FolhaEspelhoBulkJobResult {
  success: number;
  failed: number;
  total: number;
}

/**
 * Entry point do worker — gated em `workers/index.ts` por `BULLMQ_ENABLED`.
 */
export function startFolhaEspelhoBulkWorker() {
  return createWorker<FolhaEspelhoBulkJobData>(
    QUEUE_NAMES.FOLHA_ESPELHO_BULK,
    async (job: Job<FolhaEspelhoBulkJobData>) => {
      return processFolhaEspelhoBulkJob(job);
    },
    {
      // Bulk é pesado (1 PDF por funcionário + R2 upload) — single-flight
      // para não saturar o DB e o bucket.
      concurrency: 1,
      limiter: { max: 1, duration: 500 },
    },
  );
}

/**
 * Lógica principal extraída para permitir unit-test com vi.hoisted + vi.mock
 * (pattern Plan 04-05 lesson + receipt-pdf-worker).
 */
export async function processFolhaEspelhoBulkJob(
  job: Job<FolhaEspelhoBulkJobData>,
): Promise<FolhaEspelhoBulkJobResult> {
  const { tenantId, requestedBy, competencia, employeeIds, bulkJobId } =
    job.data;
  const total = employeeIds.length;
  let success = 0;
  let failed = 0;

  // ── 1. Resolver tenantContext (1x por job) ────────────────────────────────
  const tenantContext = await resolveTenantContext(tenantId);

  // ── 2. Factory do use case individual (1x por job) ────────────────────────
  const useCase = makeGenerateFolhaEspelhoUseCase();

  // ── 3. Emit start ─────────────────────────────────────────────────────────
  await emitProgress({
    tenantId,
    bulkJobId,
    total,
    success,
    failed,
    status: 'running',
  });

  // ── 4. Processar chunks ───────────────────────────────────────────────────
  for (let i = 0; i < employeeIds.length; i += CHUNK_SIZE) {
    const chunk = employeeIds.slice(i, i + CHUNK_SIZE);
    const results = await Promise.allSettled(
      chunk.map((employeeId) =>
        useCase.execute({
          tenantId,
          generatedBy: requestedBy,
          employeeId,
          competencia,
          tenantContext,
        }),
      ),
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        success++;
      } else {
        failed++;
        getLogger().warn(
          {
            bulkJobId,
            err:
              r.reason instanceof Error ? r.reason.message : String(r.reason),
          },
          '[folhaEspelhoBulkWorker] falha em 1 funcionário (continua)',
        );
      }
    }
    await emitProgress({
      tenantId,
      bulkJobId,
      total,
      success,
      failed,
      status: 'running',
    });
    try {
      await job.updateProgress({
        processed: success + failed,
        total,
        percent: Math.round(((success + failed) / total) * 100),
      });
    } catch {
      // no-op — updateProgress pode falhar em alguns ambientes de teste
    }
  }

  // ── 5. Emit completed ─────────────────────────────────────────────────────
  await emitCompleted({
    tenantId,
    bulkJobId,
    total,
    success,
    failed,
  });

  getLogger().info(
    { bulkJobId, tenantId, total, success, failed },
    '[folhaEspelhoBulkWorker] lote concluído',
  );

  return { success, failed, total };
}

// ─────────────────────────────── Helpers ─────────────────────────────────────

async function resolveTenantContext(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, settings: true },
  });
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} não encontrado`);
  }

  const esocialConfig = await prisma.esocialConfig.findUnique({
    where: { tenantId },
    select: { employerDocument: true },
  });

  const settings = (tenant.settings ?? {}) as Record<string, unknown>;
  const onlyDigits = (v: string | null | undefined): string => {
    if (!v) return '';
    return v.replace(/\D/g, '');
  };
  const cnpj =
    (onlyDigits(esocialConfig?.employerDocument).length === 14
      ? onlyDigits(esocialConfig?.employerDocument)
      : null) ??
    (typeof settings.cnpj === 'string' &&
    onlyDigits(settings.cnpj).length === 14
      ? onlyDigits(settings.cnpj)
      : '00000000000000');
  const endereco =
    typeof settings.address === 'string'
      ? (settings.address as string)
      : undefined;
  return {
    razaoSocial: tenant.name,
    cnpj,
    endereco,
  };
}

async function safeGetSocketServer(): Promise<{
  to: (room: string) => { emit: (event: string, payload: unknown) => void };
} | null> {
  try {
    const mod = await import('@/lib/websocket/socket-server');
    return mod.getSocketServer() ?? null;
  } catch {
    return null;
  }
}

async function emitProgress(payload: {
  tenantId: string;
  bulkJobId: string;
  total: number;
  success: number;
  failed: number;
  status: 'running';
}): Promise<void> {
  try {
    const ws = await safeGetSocketServer();
    ws?.to(`tenant:${payload.tenantId}:hr`).emit(
      'compliance.folha_espelho.progress',
      {
        bulkJobId: payload.bulkJobId,
        total: payload.total,
        success: payload.success,
        failed: payload.failed,
        status: payload.status,
      },
    );
  } catch (err) {
    getLogger().error(
      { err, bulkJobId: payload.bulkJobId },
      '[folhaEspelhoBulkWorker] Socket.IO progress emit falhou',
    );
  }
}

async function emitCompleted(payload: {
  tenantId: string;
  bulkJobId: string;
  total: number;
  success: number;
  failed: number;
}): Promise<void> {
  try {
    const ws = await safeGetSocketServer();
    ws?.to(`tenant:${payload.tenantId}:hr`).emit(
      'compliance.folha_espelho.completed',
      {
        bulkJobId: payload.bulkJobId,
        total: payload.total,
        success: payload.success,
        failed: payload.failed,
        status: 'completed',
      },
    );
  } catch (err) {
    getLogger().error(
      { err, bulkJobId: payload.bulkJobId },
      '[folhaEspelhoBulkWorker] Socket.IO completed emit falhou',
    );
  }
}

// Silencia warning de unused import quando env não é lido explicitamente aqui
void env;
