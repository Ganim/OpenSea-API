/**
 * Phase 7 / Plan 07-04 — D-11 CSV export use case.
 *
 * Pure business logic: receives a pre-resolved `PunchExportDataset` +
 * `FileUploadService`, serialises the dataset via `buildPunchCsv`, uploads to
 * R2 with deterministic key, and returns a 15-min presigned URL for
 * controller/worker to hand back to the user.
 *
 * **LGPD note:** Dataset shape is `PunchExportRow[]` (no CPF). See
 * `build-punch-export-dataset.ts` module doc for the upstream gate.
 */

import { createHash, randomUUID } from 'node:crypto';

import { buildPunchCsv } from '@/lib/csv/punch-csv-builder';
import type { FileUploadService } from '@/services/storage/file-upload-service';

import type { PunchExportDataset } from './build-punch-export-dataset';

const PRESIGNED_TTL_SECONDS = 15 * 60; // 15 min (matches AFD Phase 6 pattern)
const CSV_MIME = 'text/csv; charset=utf-8';

export interface ExportPunchCsvRequest {
  tenantId: string;
  generatedBy: string;
  /** Optional — dispatcher passes a pre-generated jobId for sync calls so the
   *  audit log entityId matches across sync-path and async-path. */
  jobId?: string;
  dataset: PunchExportDataset;
  /** Optional — CSV separator (default `;`). */
  separator?: ',' | ';';
}

export interface ExportPunchArtifactResponse {
  jobId: string;
  storageKey: string;
  contentHash: string;
  sizeBytes: number;
  downloadUrl: string;
}

export class ExportPunchCsvUseCase {
  constructor(
    private readonly fileUploadService: Pick<
      FileUploadService,
      'uploadWithKey' | 'getPresignedUrl'
    >,
  ) {}

  async execute(
    input: ExportPunchCsvRequest,
  ): Promise<ExportPunchArtifactResponse> {
    const buffer = buildPunchCsv(input.dataset.rows, {
      separator: input.separator,
    });
    const contentHash = createHash('sha256').update(buffer).digest('hex');
    const jobId = input.jobId ?? randomUUID();
    const storageKey = buildStorageKey({
      tenantId: input.tenantId,
      generatedAt: input.dataset.period.startDate,
      jobId,
      extension: 'csv',
    });

    await this.fileUploadService.uploadWithKey(buffer, storageKey, {
      mimeType: CSV_MIME,
      cacheControl: 'private, max-age=0, no-store',
      metadata: {
        'x-tenant-id': input.tenantId,
        'x-format': 'CSV',
        'x-job-id': jobId,
        'x-content-sha256': contentHash,
      },
    });

    const filename = buildFilename({
      cnpj: input.dataset.tenant.cnpj,
      period: input.dataset.period,
      extension: 'csv',
    });
    const downloadUrl = await this.fileUploadService.getPresignedUrl(
      storageKey,
      PRESIGNED_TTL_SECONDS,
      `attachment; filename="${filename}"`,
    );

    return {
      jobId,
      storageKey,
      contentHash,
      sizeBytes: buffer.length,
      downloadUrl,
    };
  }
}

export function buildStorageKey(params: {
  tenantId: string;
  generatedAt: Date;
  jobId: string;
  extension: 'csv' | 'pdf' | 'txt';
}): string {
  const year = params.generatedAt.getUTCFullYear();
  const month = String(params.generatedAt.getUTCMonth() + 1).padStart(2, '0');
  return `${params.tenantId}/hr/exports/${year}/${month}/${params.jobId}.${params.extension}`;
}

export function buildFilename(params: {
  cnpj: string;
  period: { startDate: Date; endDate: Date };
  extension: 'csv' | 'pdf' | 'txt';
}): string {
  const s = params.period.startDate.toISOString().slice(0, 10);
  const e = params.period.endDate.toISOString().slice(0, 10);
  return `batidas_${params.cnpj}_${s}_${e}.${params.extension}`;
}
