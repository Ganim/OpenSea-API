import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted mocks ─────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  prismaAuditFindFirst: vi.fn(),
  prismaAuditCreate: vi.fn(),
  csvExecute: vi.fn(),
  pdfExecute: vi.fn(),
  afdExecute: vi.fn(),
  afdtExecute: vi.fn(),
  buildPunchDataset: vi.fn(),
  buildAfdDataset: vi.fn(),
  notifDispatch: vi.fn(),
}));

vi.mock('@/@env', () => ({
  env: {
    NODE_ENV: 'test',
    BULLMQ_ENABLED: false,
  },
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: { PUNCH_BATCH_EXPORT: 'punch-batch-export' },
  createWorker: vi.fn((name, handler) => ({ name, handler })),
  addJob: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: mocks.prismaAuditFindFirst,
      create: mocks.prismaAuditCreate,
    },
  },
}));

vi.mock('@/use-cases/hr/punch/export/build-punch-export-dataset', () => ({
  buildPunchExportDataset: mocks.buildPunchDataset,
}));

vi.mock('@/http/controllers/hr/compliance/build-afd-dataset', () => ({
  buildAfdDataset: mocks.buildAfdDataset,
}));

vi.mock('@/use-cases/hr/punch/export/factories/make-export-punch-csv', () => ({
  makeExportPunchCsvUseCase: () => ({ execute: mocks.csvExecute }),
}));

vi.mock('@/use-cases/hr/punch/export/factories/make-export-punch-pdf', () => ({
  makeExportPunchPdfUseCase: () => ({ execute: mocks.pdfExecute }),
}));

vi.mock('@/use-cases/hr/compliance/factories/make-generate-afd', () => ({
  makeGenerateAfdUseCase: () => ({ execute: mocks.afdExecute }),
}));

vi.mock('@/use-cases/hr/compliance/factories/make-generate-afdt', () => ({
  makeGenerateAfdtUseCase: () => ({ execute: mocks.afdtExecute }),
}));

vi.mock('@/modules/notifications/public', async () => {
  // Re-export the enum constants so the worker module continues to compile.
  const actual = await vi.importActual<
    typeof import('@/modules/notifications/public')
  >('@/modules/notifications/public');
  return {
    ...actual,
    notificationClient: {
      dispatch: mocks.notifDispatch,
      resolve: vi.fn(),
      updateProgress: vi.fn(),
      registerManifest: vi.fn(),
      cancel: vi.fn(),
      dispatchBulkAsync: vi.fn(),
    },
  };
});

import { processPunchBatchExportJob } from './punch-batch-export-worker';
import type { PunchBatchExportJobData } from './punch-batch-export-worker';

const commonJobData: PunchBatchExportJobData = {
  jobId: '00000000-0000-0000-0000-000000000abc',
  tenantId: 'tenant-1',
  generatedBy: 'user-1',
  format: 'CSV',
  filters: {
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-04-30T23:59:59.999Z',
  },
};

const commonResult = {
  jobId: '00000000-0000-0000-0000-000000000abc',
  storageKey: 'tenant-1/hr/exports/2026/04/abc.csv',
  downloadUrl: 'https://s3.example/.csv?sig=x',
  contentHash: 'a'.repeat(64),
  sizeBytes: 100,
};

const emptyDataset = {
  rows: [],
  tenant: { id: 'tenant-1', name: 'Empresa Demo', cnpj: '12345678000190' },
  period: {
    startDate: new Date('2026-04-01T00:00:00Z'),
    endDate: new Date('2026-04-30T23:59:59Z'),
  },
};

const emptyAfdDataset = {
  header: {},
  empresas: [],
  empregados: [],
  marcacoes: [],
};

beforeEach(() => {
  for (const m of Object.values(mocks)) {
    m.mockReset();
  }
  mocks.prismaAuditFindFirst.mockResolvedValue(null);
  mocks.prismaAuditCreate.mockResolvedValue({ id: 'audit-1' });
  mocks.csvExecute.mockResolvedValue(commonResult);
  mocks.pdfExecute.mockResolvedValue({
    ...commonResult,
    storageKey: commonResult.storageKey.replace('.csv', '.pdf'),
  });
  mocks.afdExecute.mockResolvedValue({
    artifactId: 'artifact-afd-1',
    storageKey: 'tenant-1/compliance/afd/2026/04/artifact-afd-1.txt',
    downloadUrl: 'https://s3.example/afd.txt?sig=x',
    contentHash: 'c'.repeat(64),
    sizeBytes: 512,
  });
  mocks.afdtExecute.mockResolvedValue({
    artifactId: 'artifact-afdt-1',
    storageKey: 'tenant-1/compliance/afdt/2026/04/artifact-afdt-1.txt',
    downloadUrl: 'https://s3.example/afdt.txt?sig=x',
    contentHash: 'd'.repeat(64),
    sizeBytes: 600,
  });
  mocks.buildPunchDataset.mockResolvedValue(emptyDataset);
  mocks.buildAfdDataset.mockResolvedValue(emptyAfdDataset);
  mocks.notifDispatch.mockResolvedValue({
    notificationIds: ['notif-1'],
    recipientCount: 1,
    deduplicated: false,
    suppressedByPreference: 0,
  });
});

describe('processPunchBatchExportJob', () => {
  it('skipped:true quando AuditLog já existe para o jobId (idempotency)', async () => {
    mocks.prismaAuditFindFirst.mockResolvedValueOnce({ id: 'existing' });

    const result = await processPunchBatchExportJob(commonJobData);

    expect(result.skipped).toBe(true);
    expect(mocks.buildPunchDataset).not.toHaveBeenCalled();
    expect(mocks.csvExecute).not.toHaveBeenCalled();
    expect(mocks.notifDispatch).not.toHaveBeenCalled();
  });

  it('CSV → chama ExportPunchCsvUseCase + grava audit + dispatcha notification', async () => {
    const result = await processPunchBatchExportJob(commonJobData);

    expect(mocks.csvExecute).toHaveBeenCalledTimes(1);
    expect(mocks.prismaAuditCreate).toHaveBeenCalledTimes(1);
    const auditArgs = mocks.prismaAuditCreate.mock.calls[0][0].data;
    expect(auditArgs.action).toBe('PUNCH_BATCH_EXPORTED');
    expect(auditArgs.entity).toBe('EXPORT_JOB');
    expect(auditArgs.entityId).toBe(commonJobData.jobId);

    expect(mocks.notifDispatch).toHaveBeenCalledTimes(1);
    const notifArgs = mocks.notifDispatch.mock.calls[0][0];
    expect(notifArgs.category).toBe('punch.export_ready');
    expect(notifArgs.recipients.userIds).toEqual([commonJobData.generatedBy]);
    expect(notifArgs.metadata.downloadUrl).toBe(commonResult.downloadUrl);

    expect(result.skipped).toBe(false);
    expect(result.storageKey).toBe(commonResult.storageKey);
  });

  it('AFD → delega makeGenerateAfdUseCase (Phase 6 reuse) + NÃO chama CSV useCase', async () => {
    const result = await processPunchBatchExportJob({
      ...commonJobData,
      format: 'AFD',
      filters: { ...commonJobData.filters, cnpj: '12345678000190' },
    });

    expect(mocks.buildAfdDataset).toHaveBeenCalledTimes(1);
    expect(mocks.afdExecute).toHaveBeenCalledTimes(1);
    expect(mocks.csvExecute).not.toHaveBeenCalled();
    expect(mocks.pdfExecute).not.toHaveBeenCalled();
    expect(mocks.afdtExecute).not.toHaveBeenCalled();
    expect(result.skipped).toBe(false);
    // O downloadUrl vem do AFD useCase — garantimos a notificação carrega ele.
    expect(mocks.notifDispatch.mock.calls[0][0].metadata.downloadUrl).toContain(
      'afd',
    );
  });

  it('AFDT → delega makeGenerateAfdtUseCase', async () => {
    await processPunchBatchExportJob({
      ...commonJobData,
      format: 'AFDT',
    });
    expect(mocks.afdtExecute).toHaveBeenCalledTimes(1);
    expect(mocks.afdExecute).not.toHaveBeenCalled();
  });

  it('P2002 em AuditLog.create é tratado como skipped (concurrent race)', async () => {
    const p2002 = Object.assign(new Error('Unique constraint'), {
      code: 'P2002',
    });
    mocks.prismaAuditCreate.mockRejectedValueOnce(p2002);

    const result = await processPunchBatchExportJob(commonJobData);

    expect(result.skipped).toBe(true);
    // Notification não é dispatchada pois retornamos antes
    expect(mocks.notifDispatch).not.toHaveBeenCalled();
  });

  it('Falha no notification dispatch NÃO propaga — artifact + audit já gravados', async () => {
    mocks.notifDispatch.mockRejectedValueOnce(
      new Error('NotificationClient not initialized'),
    );

    const result = await processPunchBatchExportJob(commonJobData);

    expect(result.skipped).toBe(false);
    expect(result.storageKey).toBe(commonResult.storageKey);
    expect(mocks.prismaAuditCreate).toHaveBeenCalled();
  });
});
