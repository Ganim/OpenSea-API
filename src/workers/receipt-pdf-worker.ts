/**
 * Receipt PDF worker (Phase 06 / Plan 06-03).
 *
 * Subscreve `QUEUE_NAMES.RECEIPT_PDF` e gera 1 recibo PDF por batida criada.
 *
 * Fluxo:
 *   1. Recebe job `{ timeEntryId, tenantId }` (enfileirado pelo
 *      `receiptPdfDispatcherConsumer`).
 *   2. Idempotency check: `ComplianceArtifact` tipo RECIBO com
 *      `filters.timeEntryId = X` — se já existe, retorna `{ skipped: true }`
 *      (replay safe, Pitfall 5).
 *   3. Fetch TimeEntry + Employee + Tenant + EsocialConfig (CNPJ).
 *   4. Calcula `nsrHash = computeReceiptNsrHash(tenantId, nsrNumber)`.
 *   5. Renderiza PDF via `renderReceiptPdf` (pdfkit A6 + QR code).
 *   6. Upload ao R2 com key determinística:
 *      `{tenantId}/compliance/recibo/{YYYY}/{MM}/{nsrHash}.pdf`
 *   7. `prisma.$transaction([timeEntry.update, complianceArtifact.create])`
 *      — atomicidade garantida (T-06-03-10 mitigação).
 *   8. Retorna `{ success, storageKey, contentHash }`.
 *
 * Redis fallback (T-06-03-12): em caso de falha de R2, cache no Redis com
 * TTL 24h (pattern Plan 05-06 badge-pdf-worker) e DLQ via BullMQ retry.
 *
 * Gating: BULLMQ_ENABLED continua sendo o interruptor geral em
 * `workers/index.ts` (commit 013b8989 — lesson Redis quota exhaustion).
 */

import { createHash } from 'node:crypto';

import type { Job } from 'bullmq';

import { env } from '@/@env';
import { computeReceiptNsrHash } from '@/lib/compliance/nsr-hash';
import { renderReceiptPdf } from '@/lib/pdf/receipt-pdf-renderer';
import { prisma } from '@/lib/prisma';
import { createWorker, QUEUE_NAMES } from '@/lib/queue';
import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

// Lazy logger (Plan 04-05 pattern).
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

export interface ReceiptPdfJobData {
  timeEntryId: string;
  tenantId: string;
}

export interface ReceiptPdfJobResult {
  success?: boolean;
  skipped?: boolean;
  storageKey?: string;
  contentHash?: string;
}

const SYSTEM_GENERATED_BY = 'system:receipt-pdf-worker';

/**
 * Traduz o entryType raw em label amigável em português para o PDF.
 * Mantido ESPECÍFICO para o PDF privado (cartaz do funcionário); a rota
 * pública usa o mapper próprio de public-receipt-mapper.ts.
 */
function entryTypeLabelPt(t: string): string {
  switch (t) {
    case 'CLOCK_IN':
      return 'Entrada';
    case 'CLOCK_OUT':
      return 'Saída';
    case 'BREAK_START':
      return 'Início do intervalo';
    case 'BREAK_END':
      return 'Retorno do intervalo';
    case 'OVERTIME_START':
      return 'Início de hora extra';
    case 'OVERTIME_END':
      return 'Retorno de hora extra';
    default:
      return t;
  }
}

export function startReceiptPdfWorker() {
  return createWorker<ReceiptPdfJobData>(
    QUEUE_NAMES.RECEIPT_PDF,
    async (job: Job<ReceiptPdfJobData>): Promise<ReceiptPdfJobResult> => {
      return processReceiptPdfJob(job.data);
    },
    {
      // Recibo é sintético (< 30KB) e rápido; permitir concorrência maior
      // que badge-pdf (concurrency 1 bulk) — vários funcionários batem
      // ponto ao mesmo tempo em horários-pico (08:00/18:00).
      concurrency: 3,
      limiter: { max: 30, duration: 1000 }, // 30 recibos/s máximo
    },
  );
}

/**
 * Lógica do job extraída para permitir unit-test com vi.hoisted + vi.mock.
 */
export async function processReceiptPdfJob(
  data: ReceiptPdfJobData,
): Promise<ReceiptPdfJobResult> {
  const { timeEntryId, tenantId } = data;

  // ── 1. Idempotency check (Pitfall 5) ─────────────────────────────────────
  const existing = await prisma.complianceArtifact.findFirst({
    where: {
      tenantId,
      type: 'RECIBO',
      deletedAt: null,
      filters: {
        path: ['timeEntryId'],
        equals: timeEntryId,
      },
    },
    select: { id: true },
  });
  if (existing) {
    getLogger().info(
      { timeEntryId, tenantId, artifactId: existing.id },
      '[receiptPdfWorker] skipped: already generated',
    );
    return { skipped: true };
  }

  // ── 2. Fetch data ────────────────────────────────────────────────────────
  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
    select: {
      id: true,
      tenantId: true,
      employeeId: true,
      nsrNumber: true,
      timestamp: true,
      entryType: true,
      employee: {
        select: {
          id: true,
          fullName: true,
          socialName: true,
          registrationNumber: true,
          department: { select: { name: true } },
        },
      },
      punchApproval: { select: { status: true } },
    },
  });
  if (!timeEntry) {
    throw new Error(`TimeEntry ${timeEntryId} not found`);
  }
  if (timeEntry.tenantId !== tenantId) {
    throw new Error(
      `TimeEntry ${timeEntryId} belongs to another tenant (${timeEntry.tenantId} vs ${tenantId})`,
    );
  }
  if (timeEntry.nsrNumber == null) {
    // Batidas sem NSR não geram recibo público (Portaria exige NSR válido).
    getLogger().warn(
      { timeEntryId, tenantId },
      '[receiptPdfWorker] skipped: nsrNumber ausente',
    );
    return { skipped: true };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, settings: true },
  });
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
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
  const tenantCnpj =
    (onlyDigits(esocialConfig?.employerDocument).length === 14
      ? onlyDigits(esocialConfig?.employerDocument)
      : null) ??
    (typeof settings.cnpj === 'string' &&
    onlyDigits(settings.cnpj).length === 14
      ? onlyDigits(settings.cnpj)
      : '00000000000000');

  // ── 3. Compute HMAC + URL ───────────────────────────────────────────────
  const nsrHash = computeReceiptNsrHash(tenantId, timeEntry.nsrNumber);
  const appUrl =
    (typeof process.env.APP_URL === 'string' && process.env.APP_URL) ||
    env.PUBLIC_API_URL ||
    'http://localhost:3000';
  const verifyUrl = `${appUrl.replace(/\/$/, '')}/punch/verify/${nsrHash}`;

  // ── 4. Render PDF ───────────────────────────────────────────────────────
  const buffer = await renderReceiptPdf({
    tenantRazaoSocial: tenant.name,
    tenantCnpj,
    employeeName: timeEntry.employee.socialName || timeEntry.employee.fullName,
    employeeRegistrationNumber: timeEntry.employee.registrationNumber,
    employeeDepartmentName: timeEntry.employee.department?.name ?? undefined,
    nsrNumber: timeEntry.nsrNumber,
    timestamp: timeEntry.timestamp,
    entryTypeLabel: entryTypeLabelPt(timeEntry.entryType),
    status:
      timeEntry.punchApproval?.status === 'PENDING'
        ? 'PENDING_APPROVAL'
        : 'APPROVED',
    nsrHash,
    verifyUrl,
  });

  // ── 5. Upload R2 ────────────────────────────────────────────────────────
  const now = timeEntry.timestamp;
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const storageKey = `${tenantId}/compliance/recibo/${year}/${month}/${nsrHash}.pdf`;

  try {
    const s3 = S3FileUploadService.getInstance();
    await s3.uploadWithKey(buffer, storageKey, {
      mimeType: 'application/pdf',
      cacheControl: 'public, max-age=86400', // 24h TTL
      metadata: {
        tenantId,
        timeEntryId,
        nsrNumber: String(timeEntry.nsrNumber),
      },
    });
  } catch (err) {
    // Redis fallback (pattern 05-06) — cache buffer e deixa BullMQ re-tentar.
    getLogger().error(
      {
        err: err instanceof Error ? err.message : String(err),
        timeEntryId,
        tenantId,
      },
      '[receiptPdfWorker] R2 upload failed — Redis fallback + retry',
    );
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const redisMod = require('@/lib/redis');
      const client = redisMod.redis?.client ?? redisMod.redis;
      if (client?.set) {
        await client.set(
          `receipt-pdf-fallback:${nsrHash}`,
          buffer,
          'EX',
          86400,
        );
      }
    } catch (redisErr) {
      getLogger().error(
        { err: redisErr },
        '[receiptPdfWorker] Redis fallback também falhou — DLQ via retry',
      );
    }
    throw err; // BullMQ faz retry com backoff exponencial
  }

  const contentHash = createHash('sha256').update(buffer).digest('hex');

  // ── 6. Persist: TimeEntry.update + ComplianceArtifact.create (atomic) ────
  await prisma.$transaction([
    prisma.timeEntry.updateMany({
      where: { id: timeEntryId, tenantId },
      data: {
        receiptGenerated: true,
        receiptUrl: storageKey,
        receiptVerifyHash: nsrHash,
      },
    }),
    prisma.complianceArtifact.create({
      data: {
        tenantId,
        type: 'RECIBO',
        periodStart: timeEntry.timestamp,
        periodEnd: timeEntry.timestamp,
        filters: {
          timeEntryId,
          employeeId: timeEntry.employeeId,
          nsrNumber: timeEntry.nsrNumber,
        },
        storageKey,
        contentHash,
        sizeBytes: buffer.length,
        generatedBy: SYSTEM_GENERATED_BY,
      },
    }),
  ]);

  getLogger().info(
    {
      timeEntryId,
      tenantId,
      nsrHash,
      storageKey,
      sizeBytes: buffer.length,
    },
    '[receiptPdfWorker] recibo gerado',
  );

  return {
    success: true,
    storageKey,
    contentHash,
  };
}
