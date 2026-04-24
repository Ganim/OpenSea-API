import { DispatchPunchBatchExportUseCase } from '../dispatch-punch-batch-export';
import { makeExportPunchCsvUseCase } from './make-export-punch-csv';
import { makeExportPunchPdfUseCase } from './make-export-punch-pdf';

/**
 * Phase 07 / Plan 07-04 — factory de `DispatchPunchBatchExportUseCase`.
 *
 * Injeta os dois use cases sync (CSV + PDF). Não injeta os use cases AFD/AFDT
 * porque o dispatcher sempre enfileira para esses formatos — a execução real
 * acontece no worker (`punch-batch-export-worker`) via
 * `makeGenerateAfd/Afdt` (Phase 6).
 */
export function makeDispatchPunchBatchExportUseCase(): DispatchPunchBatchExportUseCase {
  return new DispatchPunchBatchExportUseCase(
    makeExportPunchCsvUseCase(),
    makeExportPunchPdfUseCase(),
  );
}
