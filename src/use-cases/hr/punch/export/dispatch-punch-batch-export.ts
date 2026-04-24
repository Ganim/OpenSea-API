/**
 * Phase 7 / Plan 07-04 — D-11 dispatcher: sync vs async threshold logic.
 *
 * Entry-point chamado pelo controller `v1-export-punch-batch`. Decide entre:
 *   - Sync: executa o use case CSV/PDF inline e devolve o artifact response
 *           ao client (200). Thresholds CSV < 10k, PDF < 3k (PDF é mais
 *           caro por linha que CSV).
 *   - Async: enfileira `QUEUE_NAMES.PUNCH_BATCH_EXPORT` com `jobId` (UUID).
 *           Controller devolve 202 ao client; worker gera artifact + upload
 *           R2 + audit log + notification in-app.
 *
 * **AFD/AFDT → SEMPRE async**: delegam `makeGenerateAfd/Afdt` da Phase 6. O
 * builder AFD recebe um `AfdBuildInput` completo (header + empresas +
 * empregados + marcações), que o worker monta via `buildAfdDataset` (helper
 * Phase 6). Por isso o dispatcher NÃO executa AFD/AFDT inline.
 *
 * **Anti-DoS / T-7-04-04:** o caminho async herda o limiter do worker
 * (`concurrency: 2, max 10/s`). Duas exportações simultâneas no mesmo
 * processo são impossíveis pelo design da fila.
 */

import { randomUUID } from 'node:crypto';

import { addJob, QUEUE_NAMES } from '@/lib/queue';

import {
  buildPunchExportDataset,
  type PunchExportDataset,
} from './build-punch-export-dataset';
import { countPunchExportRows } from './count-punch-export-rows';
import type {
  ExportPunchArtifactResponse,
  ExportPunchCsvUseCase,
} from './export-punch-csv';
import type { ExportPunchPdfUseCase } from './export-punch-pdf';

export type ExportFormat = 'CSV' | 'PDF' | 'AFD' | 'AFDT';

export interface DispatchPunchBatchExportFilters {
  startDate: Date;
  endDate: Date;
  employeeIds?: string[];
  departmentIds?: string[];
  cnpj?: string;
}

export interface DispatchPunchBatchExportInput {
  tenantId: string;
  generatedBy: string;
  format: ExportFormat;
  filters: DispatchPunchBatchExportFilters;
  /** Prisma client — injectable for tests. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
}

export interface SerializedFilters {
  startDate: string;
  endDate: string;
  employeeIds?: string[];
  departmentIds?: string[];
  cnpj?: string;
}

export interface PunchBatchExportJobData {
  jobId: string;
  tenantId: string;
  generatedBy: string;
  format: ExportFormat;
  filters: SerializedFilters;
}

export type DispatchPunchBatchExportResult =
  | { mode: 'sync'; response: ExportPunchArtifactResponse }
  | { mode: 'async'; jobId: string };

/**
 * Threshold CSV: 10k linhas = cerca de 1-2MB texto (ok em memory no controller).
 * Threshold PDF: 3k linhas = cerca de 500KB buffer (pdfkit é mais caro).
 * Acima disso o worker empurra pra fila + notifica quando pronto.
 */
export const CSV_SYNC_MAX_ROWS = 10_000;
export const PDF_SYNC_MAX_ROWS = 3_000;

export class DispatchPunchBatchExportUseCase {
  constructor(
    private readonly csvUseCase: ExportPunchCsvUseCase,
    private readonly pdfUseCase: ExportPunchPdfUseCase,
  ) {}

  async execute(
    input: DispatchPunchBatchExportInput,
  ): Promise<DispatchPunchBatchExportResult> {
    const jobId = randomUUID();

    // AFD/AFDT sempre async — o worker delega a `makeGenerateAfd/Afdt`
    // (Phase 6) que constroi o buffer byte-perfect ISO-8859-1 + CRLF + CRC.
    if (input.format === 'AFD' || input.format === 'AFDT') {
      await this.enqueue(jobId, input);
      return { mode: 'async', jobId };
    }

    const { estimated } = await countPunchExportRows({
      prisma: input.prisma,
      tenantId: input.tenantId,
      startDate: input.filters.startDate,
      endDate: input.filters.endDate,
      employeeIds: input.filters.employeeIds,
      departmentIds: input.filters.departmentIds,
    });

    const threshold =
      input.format === 'CSV' ? CSV_SYNC_MAX_ROWS : PDF_SYNC_MAX_ROWS;

    if (estimated < threshold) {
      const dataset: PunchExportDataset = await buildPunchExportDataset({
        prisma: input.prisma,
        tenantId: input.tenantId,
        startDate: input.filters.startDate,
        endDate: input.filters.endDate,
        employeeIds: input.filters.employeeIds,
        departmentIds: input.filters.departmentIds,
      });

      const response: ExportPunchArtifactResponse =
        input.format === 'CSV'
          ? await this.csvUseCase.execute({
              tenantId: input.tenantId,
              generatedBy: input.generatedBy,
              jobId,
              dataset,
            })
          : await this.pdfUseCase.execute({
              tenantId: input.tenantId,
              generatedBy: input.generatedBy,
              jobId,
              dataset,
            });

      return { mode: 'sync', response };
    }

    await this.enqueue(jobId, input);
    return { mode: 'async', jobId };
  }

  private async enqueue(
    jobId: string,
    input: DispatchPunchBatchExportInput,
  ): Promise<void> {
    const data: PunchBatchExportJobData = {
      jobId,
      tenantId: input.tenantId,
      generatedBy: input.generatedBy,
      format: input.format,
      filters: serializeFilters(input.filters),
    };
    await addJob(QUEUE_NAMES.PUNCH_BATCH_EXPORT, data, { jobId });
  }
}

export function serializeFilters(
  filters: DispatchPunchBatchExportFilters,
): SerializedFilters {
  return {
    startDate: filters.startDate.toISOString(),
    endDate: filters.endDate.toISOString(),
    employeeIds: filters.employeeIds,
    departmentIds: filters.departmentIds,
    cnpj: filters.cnpj,
  };
}
