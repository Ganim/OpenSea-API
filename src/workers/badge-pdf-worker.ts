import { createHash, randomBytes } from 'node:crypto';

import type { Job } from 'bullmq';

import {
  PUNCH_EVENTS,
  type PunchQrRotationCompletedData,
} from '@/lib/events/punch-events';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import {
  renderA4BadgeSheet,
  type BadgeData,
} from '@/lib/pdf/badge-pdf-renderer';
import { prisma } from '@/lib/prisma';
import { createWorker, QUEUE_NAMES } from '@/lib/queue';

// Lazy logger (same pattern as qr-batch-worker) — avoids pulling @/@env
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

/**
 * Payload shape on the `badge-pdf-generation` queue. The worker accepts
 * TWO discriminator paths:
 *
 *   1. Sub-job enqueued by `qrBatchWorker` (Plan 05-04): `tokens` is
 *      populated with `{ employeeId, token }` pairs already rotated inside
 *      the parent chunked transaction. The worker uses those as-is and
 *      does NOT re-rotate.
 *   2. Standalone invocation from `POST /v1/hr/qr-tokens/bulk-pdf`
 *      (Plan 05-06 Task 3): `rotateTokens === true`, `tokens` is absent.
 *      The worker rotates each employee inline (randomBytes(32) + sha256)
 *      and accumulates the plaintext tokens for the renderer.
 */
export interface BadgePdfJobPayload {
  tenantId: string;
  scope: 'ALL' | 'DEPARTMENT' | 'CUSTOM';
  employeeIds: string[];
  invokedByUserId: string;
  /** Set by the qr-batch worker when this is a sub-job. */
  parentJobId?: string | number;
  /** True = worker rotates each employee inline (standalone bulk-pdf path). */
  rotateTokens?: boolean;
  /** Pre-rotated tokens from the qr-batch sub-job path. */
  tokens?: Array<{ employeeId: string; token: string }>;
}

/**
 * BullMQ worker for `QUEUE_NAMES.BADGE_PDF` (Plan 05-06 Task 2).
 *
 * Flow:
 *   1. Acquire plaintext tokens — either use `payload.tokens` from the
 *      qr-batch sub-job, or rotate each employee inline (standalone
 *      bulk-pdf endpoint).
 *   2. Fetch tenant + employee rows in a single `findMany` for the
 *      renderer (no N+1).
 *   3. Hand a `BadgeData[]` to the pure pdfkit `renderA4BadgeSheet`
 *      helper → returns a Buffer with the A4 2×4 lote PDF.
 *   4. Upload to S3 (preferred) with 24h pre-signed URL. If S3 env vars
 *      are not configured, fall back to Redis under `badge-pdf:{jobId}`
 *      with 24h TTL and return the local download endpoint URL.
 *   5. Publish `PUNCH_EVENTS.QR_ROTATION_COMPLETED` with
 *      `bulkPdfDownloadUrl` set so Plan 05-02's notification consumer can
 *      deliver the "seu lote de crachás está pronto" message to the
 *      invoking admin.
 */
export function startBadgePdfWorker() {
  return createWorker<BadgePdfJobPayload>(
    QUEUE_NAMES.BADGE_PDF,
    async (job: Job<BadgePdfJobPayload>) => {
      const {
        tenantId,
        employeeIds,
        invokedByUserId,
        rotateTokens,
        tokens: providedTokens,
      } = job.data;

      // 1. Acquire plaintext tokens.
      let tokens: Array<{ employeeId: string; token: string }>;
      if (providedTokens && providedTokens.length > 0) {
        tokens = providedTokens;
      } else if (rotateTokens) {
        tokens = [];
        // Rotate each employee inline. We deliberately don't wrap this in
        // a single `$transaction` here (unlike qr-batch-worker) because
        // the standalone bulk-pdf path is typically small (<=50 crachás
        // of a lost-badge re-issue run) and we want partial progress on
        // failure rather than all-or-nothing.
        for (const employeeId of employeeIds) {
          const token = randomBytes(32).toString('hex');
          const hash = createHash('sha256').update(token).digest('hex');
          await prisma.employee.updateMany({
            where: { id: employeeId, tenantId, deletedAt: null },
            data: { qrTokenHash: hash, qrTokenSetAt: new Date() },
          });
          tokens.push({ employeeId, token });
        }
      } else {
        throw new Error(
          '[badgePdfWorker] Payload missing tokens and rotateTokens=false',
        );
      }

      // 2. Fetch tenant + employees.
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new Error(`[badgePdfWorker] Tenant ${tenantId} not found`);
      }
      const employees = await prisma.employee.findMany({
        where: { id: { in: employeeIds }, tenantId, deletedAt: null },
      });

      const brandColor = extractBrandColor(tenant.settings);
      const cards: BadgeData[] = employees.map((e: Record<string, unknown>) => {
        const tok = tokens.find((t) => t.employeeId === e.id);
        if (!tok) {
          throw new Error(
            `[badgePdfWorker] No rotated token for employee ${String(e.id)}`,
          );
        }
        return {
          employeeId: e.id as string,
          fullName: (e.fullName as string) ?? (e.name as string) ?? '',
          socialName: (e.socialName as string | null) ?? null,
          registration:
            (e.registrationNumber as string) ??
            (e.registration as string) ??
            '',
          photoUrl: (e.photoUrl as string | null) ?? null,
          qrToken: tok.token,
          tenantName: tenant.name as string,
          tenantLogoUrl: (tenant.logoUrl as string | null) ?? null,
          tenantBrandColor: brandColor,
          rotatedAt: new Date(),
        };
      });

      // 3. Render the A4 lote PDF.
      const pdf = await renderA4BadgeSheet(cards);

      // 4. Persist to S3 (primary) or Redis (fallback).
      const downloadUrl = await uploadBadgePdf({
        tenantId,
        jobId: String(job.id),
        pdf,
      });

      // Progress ping (kiosk admin UI subscribes to the Socket.IO room —
      // best-effort, mirroring qr-batch-worker behaviour).
      try {
        const ws = await safeGetSocketServer();
        ws?.to(`tenant:${tenantId}:hr`).emit('punch.badge_pdf.progress', {
          jobId: job.id,
          processed: cards.length,
          total: cards.length,
          percent: 100,
        });
      } catch (err) {
        getLogger().error(
          { jobId: job.id, err },
          '[badgePdfWorker] Socket.IO emit failed — job progress still tracked via job return value',
        );
      }

      // 5. Publish completion event (reuses QR_ROTATION_COMPLETED — the
      // Plan 05-02 consumer turns it into the "lote pronto" notification).
      const payload: PunchQrRotationCompletedData = {
        jobId: String(job.id),
        tenantId,
        invokedByUserId,
        processed: cards.length,
        total: cards.length,
        generatedPdfs: true,
        bulkPdfDownloadUrl: downloadUrl,
      };
      try {
        await getTypedEventBus().publish({
          type: PUNCH_EVENTS.QR_ROTATION_COMPLETED,
          version: 1,
          tenantId,
          source: 'hr',
          sourceEntityType: 'badge-pdf-job',
          sourceEntityId: String(job.id),
          data: payload as unknown as Record<string, unknown>,
          metadata: { userId: invokedByUserId },
        });
      } catch (err) {
        getLogger().error(
          { jobId: job.id, err },
          '[badgePdfWorker] Failed to publish QR_ROTATION_COMPLETED event',
        );
      }

      return { downloadUrl, cardCount: cards.length };
    },
    {
      // Bulk PDF generation is heavy (pdfkit + QR encoding per card) — keep
      // it single-flight so one big lote does not starve other workers.
      concurrency: 1,
      limiter: { max: 1, duration: 500 },
    },
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractBrandColor(settings: unknown): string {
  if (
    settings &&
    typeof settings === 'object' &&
    settings !== null &&
    'brandColor' in settings
  ) {
    const raw = (settings as { brandColor?: unknown }).brandColor;
    if (typeof raw === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  }
  return '#2563EB';
}

/**
 * Uploads the rendered PDF to S3 with a 24h pre-signed URL. When S3 env vars
 * are not configured (local dev without MinIO), degrades gracefully by
 * storing the buffer in Redis under `badge-pdf:{jobId}` (24h TTL) and
 * returning the local download endpoint URL — mirrors S3 semantics for the
 * admin UI.
 */
async function uploadBadgePdf({
  tenantId,
  jobId,
  pdf,
}: {
  tenantId: string;
  jobId: string;
  pdf: Buffer;
}): Promise<string> {
  // Prefer S3 when the MinIO/S3 credentials are present.
  const s3Ready =
    !!process.env.S3_BUCKET &&
    !!process.env.S3_REGION &&
    !!process.env.S3_ACCESS_KEY_ID &&
    !!process.env.S3_SECRET_ACCESS_KEY &&
    !!process.env.S3_ENDPOINT;

  if (s3Ready) {
    try {
      // Dynamic import so unit specs + test envs without aws-sdk loaded
      // into memory do not pay the cost.
      const { S3Client, PutObjectCommand, GetObjectCommand } = await import(
        '@aws-sdk/client-s3'
      );
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const client = new S3Client({
        region: process.env.S3_REGION!,
        endpoint: process.env.S3_ENDPOINT,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        forcePathStyle: true,
      });

      const key = `badge-pdfs/${tenantId}/${jobId}.pdf`;
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: pdf,
          ContentType: 'application/pdf',
        }),
      );

      const signed = await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
        }),
        { expiresIn: 86400 }, // 24h per D-13
      );
      return signed;
    } catch (err) {
      getLogger().error(
        { err, jobId },
        '[badgePdfWorker] S3 upload failed — falling back to Redis',
      );
      // fall through to Redis fallback
    }
  }

  // Redis fallback (dev / S3 degrade).
  const { redis } = await import('@/lib/redis');
  await redis.client.set(
    `badge-pdf:${jobId}`,
    pdf,
    'EX',
    86400, // 24h mirrors S3 presigned expiry
  );
  return `/v1/hr/qr-tokens/bulk-pdf/${jobId}/download`;
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
