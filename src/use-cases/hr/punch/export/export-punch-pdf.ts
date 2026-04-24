/**
 * Phase 7 / Plan 07-04 — D-11 PDF export use case.
 *
 * Simétrico ao `ExportPunchCsvUseCase`, mas serializa o dataset como PDF
 * A4-landscape via `renderPunchExportPdf` (pdfkit). Upload ao R2 + presigned
 * URL 15min com `Content-Disposition=attachment; filename=...`.
 *
 * **Threshold sync:** PDF é mais caro por linha que CSV (pdfkit stream +
 * layout text), por isso o dispatcher usa 3k como limite sync (ver
 * `dispatch-punch-batch-export.ts` — `PDF_SYNC_MAX_ROWS`).
 *
 * **LGPD note:** Dataset shape é `PunchExportRow[]` (no CPF). Ver
 * `build-punch-export-dataset.ts` module doc.
 */

import { createHash, randomUUID } from 'node:crypto';

import { renderPunchExportPdf } from '@/lib/pdf/punch-export-pdf-renderer';
import type { FileUploadService } from '@/services/storage/file-upload-service';

import type { PunchExportDataset } from './build-punch-export-dataset';
import {
  buildFilename,
  buildStorageKey,
  type ExportPunchArtifactResponse,
} from './export-punch-csv';

const PRESIGNED_TTL_SECONDS = 15 * 60; // 15 min — paridade com AFD/AFDT.
const PDF_MIME = 'application/pdf';

export interface ExportPunchPdfRequest {
  tenantId: string;
  generatedBy: string;
  /** Optional — dispatcher injeta o jobId para manter paridade sync/async. */
  jobId?: string;
  dataset: PunchExportDataset;
}

export class ExportPunchPdfUseCase {
  constructor(
    private readonly fileUploadService: Pick<
      FileUploadService,
      'uploadWithKey' | 'getPresignedUrl'
    >,
  ) {}

  async execute(
    input: ExportPunchPdfRequest,
  ): Promise<ExportPunchArtifactResponse> {
    const buffer = await renderPunchExportPdf(input.dataset.rows, {
      tenantName: input.dataset.tenant.name,
      cnpj: input.dataset.tenant.cnpj,
      startDate: input.dataset.period.startDate,
      endDate: input.dataset.period.endDate,
      generatedBy: input.generatedBy,
    });

    const contentHash = createHash('sha256').update(buffer).digest('hex');
    const jobId = input.jobId ?? randomUUID();
    const storageKey = buildStorageKey({
      tenantId: input.tenantId,
      generatedAt: input.dataset.period.startDate,
      jobId,
      extension: 'pdf',
    });

    await this.fileUploadService.uploadWithKey(buffer, storageKey, {
      mimeType: PDF_MIME,
      cacheControl: 'private, max-age=0, no-store',
      metadata: {
        'x-tenant-id': input.tenantId,
        'x-format': 'PDF',
        'x-job-id': jobId,
        'x-content-sha256': contentHash,
      },
    });

    const filename = buildFilename({
      cnpj: input.dataset.tenant.cnpj,
      period: input.dataset.period,
      extension: 'pdf',
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
