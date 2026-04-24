import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { ExportPunchPdfUseCase } from '../export-punch-pdf';

/**
 * Phase 07 / Plan 07-04 — factory de `ExportPunchPdfUseCase`.
 *
 * Mesma injeção do `make-export-punch-csv`: singleton S3. PDF renderer é
 * invocado dentro do use case (pdfkit stream → Buffer).
 */
export function makeExportPunchPdfUseCase(): ExportPunchPdfUseCase {
  return new ExportPunchPdfUseCase(S3FileUploadService.getInstance());
}
