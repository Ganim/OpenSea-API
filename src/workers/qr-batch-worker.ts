import { createHash, randomBytes } from 'node:crypto';

import type { Job } from 'bullmq';

import {
  PUNCH_EVENTS,
  type PunchQrRotationCompletedData,
} from '@/lib/events/punch-events';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import { prisma } from '@/lib/prisma';
import { addJob, createWorker, QUEUE_NAMES } from '@/lib/queue';

// Lazy logger (same pattern as punch-events-worker) — avoids pulling @/@env
// into unit specs that never exercise the logger.
let _logger: {
  info: (obj: unknown, msg: string) => void;
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
        error: (obj, msg) => console.error(msg, obj),
      };
    }
  }
  return _logger!;
}

/** Payload shape put on the `qr-batch-operations` queue by the bulk use case. */
export interface QrBatchJobPayload {
  tenantId: string;
  employeeIds: string[];
  generatePdfs: boolean;
  invokedByUserId: string;
  /** Cooperative cancellation flag flipped by the cancel endpoint. */
  cancelled?: boolean;
}

const CHUNK_SIZE = 100;

/**
 * BullMQ worker for `QUEUE_NAMES.QR_BATCH` (D-14 bulk QR rotation).
 *
 * Per RESEARCH §Pattern 3:
 *   - Process employees in chunks of 100 per `$transaction` (chunk-level
 *     atomicity).
 *   - For every employee in the chunk: `randomBytes(32)` → plaintext token,
 *     `sha256(token)` → hash; persist hash + `qrTokenSetAt = now()` via
 *     `tx.employee.updateMany` (tenant-scoped).
 *   - Accumulate `{employeeId, token}` pairs so the BADGE_PDF sub-job can
 *     embed them without re-rotating (contract required by 05-06/T2).
 *   - After each chunk: `job.updateProgress` + Socket.IO emit to
 *     `tenant:{id}:hr` room.
 *   - At the end: publish `PUNCH_EVENTS.QR_ROTATION_COMPLETED` (consumer
 *     registered in 05-02 turns it into a notification).
 *   - If `generatePdfs=true`: enqueue a `BADGE_PDF` sub-job with
 *     deterministic jobId `badge-{jobId}`.
 *
 * Cancellation: between chunks, re-read `job.getData()` and break if the
 * `cancelled` flag flipped (best-effort per WorkerFailOpen-01 mitigation).
 */
export function startQrBatchWorker() {
  return createWorker<QrBatchJobPayload>(
    QUEUE_NAMES.QR_BATCH,
    async (job: Job<QrBatchJobPayload>) => {
      const { tenantId, employeeIds, generatePdfs, invokedByUserId } = job.data;
      const total = employeeIds.length;
      let processed = 0;
      const rotatedTokens: Array<{ employeeId: string; token: string }> = [];

      for (let i = 0; i < total; i += CHUNK_SIZE) {
        // Cooperative cancellation check — we refetch the job data in case
        // the cancel endpoint (D-14) flipped the flag mid-run.
        const currentData = await safeGetJobData(job);
        if (currentData?.cancelled) {
          getLogger().info(
            { jobId: job.id, tenantId, processed, total },
            '[qrBatchWorker] Job cancelled mid-run — stopping',
          );
          break;
        }

        const chunk = employeeIds.slice(i, i + CHUNK_SIZE);
        await prisma.$transaction(async (tx: unknown) => {
          const typedTx = tx as {
            employee: {
              updateMany: (args: unknown) => Promise<{ count: number }>;
            };
          };
          for (const empId of chunk) {
            const token = randomBytes(32).toString('hex');
            const hash = createHash('sha256').update(token).digest('hex');
            await typedTx.employee.updateMany({
              where: { id: empId, tenantId, deletedAt: null },
              data: { qrTokenHash: hash, qrTokenSetAt: new Date() },
            });
            rotatedTokens.push({ employeeId: empId, token });
          }
        });

        processed += chunk.length;
        const percent = Math.round((processed / total) * 100);

        await job.updateProgress({ processed, total, percent });

        // Socket.IO emit — guarded: when the worker runs in a process that
        // did not initialise the websocket server (pm2 worker-only), this
        // silently no-ops instead of crashing the job.
        try {
          const ws = await safeGetSocketServer();
          ws?.to(`tenant:${tenantId}:hr`).emit('punch.qr_rotation.progress', {
            jobId: job.id,
            processed,
            total,
            percent,
          });
        } catch (err) {
          getLogger().error(
            { jobId: job.id, err },
            '[qrBatchWorker] Socket.IO emit failed — progress still tracked via job.updateProgress',
          );
        }
      }

      // Enqueue the BADGE_PDF sub-job BEFORE publishing completion so the
      // consumer can reference it in its notification payload if needed.
      if (generatePdfs && processed > 0) {
        await addJob(
          QUEUE_NAMES.BADGE_PDF,
          {
            tenantId,
            scope: 'CUSTOM',
            employeeIds,
            invokedByUserId,
            parentJobId: job.id,
            tokens: rotatedTokens,
          },
          { jobId: `badge-${job.id}` },
        );
      }

      const payload: PunchQrRotationCompletedData = {
        jobId: String(job.id),
        tenantId,
        invokedByUserId,
        processed,
        total,
        generatedPdfs: generatePdfs,
        bulkPdfDownloadUrl: null,
      };

      try {
        await getTypedEventBus().publish({
          type: PUNCH_EVENTS.QR_ROTATION_COMPLETED,
          version: 1,
          tenantId,
          source: 'hr',
          sourceEntityType: 'qr-batch-job',
          sourceEntityId: String(job.id),
          data: payload as unknown as Record<string, unknown>,
          metadata: { userId: invokedByUserId },
        });
      } catch (err) {
        getLogger().error(
          { jobId: job.id, err },
          '[qrBatchWorker] Failed to publish QR_ROTATION_COMPLETED event',
        );
      }

      return { processed, total };
    },
    {
      // Single-worker, single-flight — bulk operations are heavy and we
      // want determinism over throughput. Larger tenants will just wait a
      // few extra seconds.
      concurrency: 1,
      limiter: { max: 1, duration: 500 },
    },
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function safeGetJobData<T>(
  job: Job<T>,
): Promise<(T & { cancelled?: boolean }) | null> {
  try {
    // BullMQ `getData` may not exist on older versions; fall back to
    // `job.data` directly.
    const getData = (
      job as unknown as { getData?: () => Promise<T & { cancelled?: boolean }> }
    ).getData;
    if (typeof getData === 'function') {
      return await getData.call(job);
    }
    return job.data as T & { cancelled?: boolean };
  } catch {
    return null;
  }
}

async function safeGetSocketServer(): Promise<{
  to: (room: string) => { emit: (event: string, payload: unknown) => void };
} | null> {
  try {
    // Dynamic import so unit specs that never touch Socket.IO stay green.
    const mod = await import('@/lib/websocket/socket-server');
    return mod.getSocketServer() ?? null;
  } catch {
    return null;
  }
}
