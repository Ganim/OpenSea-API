import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks — precisam estar antes do import do módulo.
const mocks = vi.hoisted(() => ({
  addJobMock: vi.fn(
    async (_queue: string, _data: unknown, _opts?: { jobId?: string }) => ({
      id: 'bullmq-job-1',
    }),
  ),
  countMock: vi.fn(async () => ({ estimated: 0 })),
  buildDatasetMock: vi.fn(async () => ({
    rows: [],
    tenant: { id: 'tenant-1', name: 'Empresa Demo', cnpj: '12345678000190' },
    period: {
      startDate: new Date('2026-04-01T00:00:00Z'),
      endDate: new Date('2026-04-30T23:59:59Z'),
    },
  })),
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: { PUNCH_BATCH_EXPORT: 'punch-batch-export' },
  addJob: mocks.addJobMock,
}));

vi.mock('./count-punch-export-rows', () => ({
  countPunchExportRows: mocks.countMock,
}));

vi.mock('./build-punch-export-dataset', () => ({
  buildPunchExportDataset: mocks.buildDatasetMock,
}));

import { DispatchPunchBatchExportUseCase } from './dispatch-punch-batch-export';

function makeUseCases() {
  const csvExecute = vi.fn(async (input: { jobId?: string }) => ({
    jobId: input.jobId ?? 'uuid-csv',
    storageKey: 't/hr/exports/2026/04/job.csv',
    contentHash: 'a'.repeat(64),
    sizeBytes: 123,
    downloadUrl: 'https://s3.example/job.csv?sig=x',
  }));
  const pdfExecute = vi.fn(async (input: { jobId?: string }) => ({
    jobId: input.jobId ?? 'uuid-pdf',
    storageKey: 't/hr/exports/2026/04/job.pdf',
    contentHash: 'b'.repeat(64),
    sizeBytes: 456,
    downloadUrl: 'https://s3.example/job.pdf?sig=x',
  }));
  return {
    csv: { execute: csvExecute } as never,
    pdf: { execute: pdfExecute } as never,
    csvExecute,
    pdfExecute,
  };
}

const baseFilters = {
  startDate: new Date('2026-04-01T00:00:00Z'),
  endDate: new Date('2026-04-30T23:59:59Z'),
};

beforeEach(() => {
  mocks.addJobMock.mockClear();
  mocks.countMock.mockClear();
  mocks.buildDatasetMock.mockClear();
});

describe('DispatchPunchBatchExportUseCase', () => {
  it('CSV com estimated < 10k → mode=sync + csv.execute chamado', async () => {
    mocks.countMock.mockResolvedValueOnce({ estimated: 5_000 });
    const { csv, pdf, csvExecute, pdfExecute } = makeUseCases();
    const useCase = new DispatchPunchBatchExportUseCase(csv, pdf);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      format: 'CSV',
      filters: baseFilters,
      prisma: {} as never,
    });

    expect(result.mode).toBe('sync');
    expect(csvExecute).toHaveBeenCalledTimes(1);
    expect(pdfExecute).not.toHaveBeenCalled();
    expect(mocks.addJobMock).not.toHaveBeenCalled();
  });

  it('CSV com estimated >= 10k → mode=async + addJob chamado com PUNCH_BATCH_EXPORT', async () => {
    mocks.countMock.mockResolvedValueOnce({ estimated: 15_000 });
    const { csv, pdf, csvExecute } = makeUseCases();
    const useCase = new DispatchPunchBatchExportUseCase(csv, pdf);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      format: 'CSV',
      filters: baseFilters,
      prisma: {} as never,
    });

    expect(result.mode).toBe('async');
    if (result.mode !== 'async') throw new Error('expected async');
    expect(result.jobId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(csvExecute).not.toHaveBeenCalled();
    expect(mocks.addJobMock).toHaveBeenCalledTimes(1);
    const [queue, data, opts] = mocks.addJobMock.mock.calls[0];
    expect(queue).toBe('punch-batch-export');
    expect((data as { format: string }).format).toBe('CSV');
    expect((opts as { jobId: string }).jobId).toBe(result.jobId);
  });

  it('PDF com estimated < 3k → mode=sync + pdf.execute chamado', async () => {
    mocks.countMock.mockResolvedValueOnce({ estimated: 2_000 });
    const { csv, pdf, csvExecute, pdfExecute } = makeUseCases();
    const useCase = new DispatchPunchBatchExportUseCase(csv, pdf);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      format: 'PDF',
      filters: baseFilters,
      prisma: {} as never,
    });

    expect(result.mode).toBe('sync');
    expect(pdfExecute).toHaveBeenCalledTimes(1);
    expect(csvExecute).not.toHaveBeenCalled();
  });

  it('PDF com estimated >= 3k → mode=async', async () => {
    mocks.countMock.mockResolvedValueOnce({ estimated: 5_000 });
    const { csv, pdf, pdfExecute } = makeUseCases();
    const useCase = new DispatchPunchBatchExportUseCase(csv, pdf);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      format: 'PDF',
      filters: baseFilters,
      prisma: {} as never,
    });

    expect(result.mode).toBe('async');
    expect(pdfExecute).not.toHaveBeenCalled();
    expect(mocks.addJobMock).toHaveBeenCalledTimes(1);
  });

  it('AFD qualquer tamanho → mode=async SEMPRE + count NÃO é chamado', async () => {
    const { csv, pdf } = makeUseCases();
    const useCase = new DispatchPunchBatchExportUseCase(csv, pdf);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      format: 'AFD',
      filters: baseFilters,
      prisma: {} as never,
    });

    expect(result.mode).toBe('async');
    // Importante: AFD nem chama count — já vai direto pra fila.
    expect(mocks.countMock).not.toHaveBeenCalled();
    expect(mocks.addJobMock).toHaveBeenCalledTimes(1);
    const [, data] = mocks.addJobMock.mock.calls[0];
    expect((data as { format: string }).format).toBe('AFD');
  });

  it('AFDT qualquer tamanho → mode=async SEMPRE', async () => {
    const { csv, pdf } = makeUseCases();
    const useCase = new DispatchPunchBatchExportUseCase(csv, pdf);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      format: 'AFDT',
      filters: baseFilters,
      prisma: {} as never,
    });

    expect(result.mode).toBe('async');
    expect(mocks.countMock).not.toHaveBeenCalled();
    expect(mocks.addJobMock).toHaveBeenCalledTimes(1);
    const [, data] = mocks.addJobMock.mock.calls[0];
    expect((data as { format: string }).format).toBe('AFDT');
  });

  it('enqueue serializa datas como ISO string (Redis-safe)', async () => {
    const { csv, pdf } = makeUseCases();
    const useCase = new DispatchPunchBatchExportUseCase(csv, pdf);

    await useCase.execute({
      tenantId: 'tenant-1',
      generatedBy: 'user-1',
      format: 'AFD',
      filters: {
        startDate: new Date('2026-04-01T00:00:00Z'),
        endDate: new Date('2026-04-30T23:59:59Z'),
        cnpj: '12345678000190',
      },
      prisma: {} as never,
    });

    const [, data] = mocks.addJobMock.mock.calls[0];
    const typed = data as { filters: { startDate: string; endDate: string } };
    expect(typeof typed.filters.startDate).toBe('string');
    expect(typeof typed.filters.endDate).toBe('string');
    expect(typed.filters.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
