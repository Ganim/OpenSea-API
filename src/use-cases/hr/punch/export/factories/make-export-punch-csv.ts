import { S3FileUploadService } from '@/services/storage/s3-file-upload-service';

import { ExportPunchCsvUseCase } from '../export-punch-csv';

/**
 * Phase 07 / Plan 07-04 — factory de `ExportPunchCsvUseCase`.
 *
 * Injeta o singleton do `S3FileUploadService` (R2 storage). O use case é
 * puro: recebe o dataset já resolvido (cursor pagination de `build-punch-
 * export-dataset` fica fora, no dispatcher ou no worker).
 */
export function makeExportPunchCsvUseCase(): ExportPunchCsvUseCase {
  return new ExportPunchCsvUseCase(S3FileUploadService.getInstance());
}
