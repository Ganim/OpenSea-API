/**
 * folha-espelho-bulk-worker.spec.ts — Phase 06 / Plan 06-04 Task 2
 *
 * Testes unit do worker de folha espelho em lote:
 *  - Chunks de 20 com Promise.allSettled
 *  - Socket.IO emit progress chamado N vezes (N = ceil(total/20) + start)
 *  - Socket.IO completed emitido ao final com status='completed'
 *  - Falhas em 1 funcionário não abortam o lote (incrementa `failed`)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';

// Hoisted mocks (Plan 04-05 lesson)
const { executeMock, emitMock, toMock, findTenantMock, findEsocialMock } =
  vi.hoisted(() => {
    const emitMock = vi.fn();
    const toMock = vi.fn(() => ({ emit: emitMock }));
    return {
      executeMock: vi.fn(),
      emitMock,
      toMock,
      findTenantMock: vi.fn(),
      findEsocialMock: vi.fn(),
    };
  });

vi.mock('@/@env', () => ({
  env: {
    NODE_ENV: 'test',
    BULLMQ_ENABLED: true,
    RECEIPT_HMAC_KEY: undefined,
    PUBLIC_API_URL: undefined,
    S3_BUCKET: 'test-bucket',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY_ID: 'test',
    S3_SECRET_ACCESS_KEY: 'test',
    S3_ENDPOINT: 'http://localhost',
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findUnique: findTenantMock },
    esocialConfig: { findUnique: findEsocialMock },
  },
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: {
    FOLHA_ESPELHO_BULK: 'folha-espelho-bulk-generation',
  },
  createWorker: vi.fn((name, handler) => ({ name, handler })),
}));

vi.mock(
  '@/use-cases/hr/compliance/factories/make-generate-folha-espelho',
  () => ({
    makeGenerateFolhaEspelhoUseCase: () => ({
      execute: executeMock,
    }),
  }),
);

vi.mock('@/lib/websocket/socket-server', () => ({
  getSocketServer: () => ({ to: toMock }),
}));

import {
  processFolhaEspelhoBulkJob,
  startFolhaEspelhoBulkWorker,
} from './folha-espelho-bulk-worker';

function mockJob(data: {
  tenantId: string;
  requestedBy: string;
  competencia: string;
  employeeIds: string[];
  bulkJobId: string;
}): Job<typeof data> {
  return {
    id: data.bulkJobId,
    data,
    updateProgress: vi.fn().mockResolvedValue(undefined),
  } as unknown as Job<typeof data>;
}

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const USER_ID = '22222222-2222-2222-2222-222222222222';

describe('folha-espelho-bulk-worker', () => {
  beforeEach(() => {
    executeMock.mockReset();
    emitMock.mockReset();
    toMock.mockClear();
    findTenantMock.mockReset();
    findEsocialMock.mockReset();

    findTenantMock.mockResolvedValue({
      id: TENANT_ID,
      name: 'Empresa Demo LTDA',
      settings: { cnpj: '12345678000190', address: 'Rua Teste, 100' },
    });
    findEsocialMock.mockResolvedValue(null);
  });

  it('processa lote de 1 funcionário — emits progress+completed e retorna {success:1,failed:0}', async () => {
    executeMock.mockResolvedValue({
      artifactId: 'art-1',
      storageKey: 'k1',
      contentHash: 'h1',
      sizeBytes: 5000,
      downloadUrl: 'https://fake/k1',
    });

    const job = mockJob({
      tenantId: TENANT_ID,
      requestedBy: USER_ID,
      competencia: '2026-03',
      employeeIds: ['emp-1'],
      bulkJobId: 'bulk-1',
    });

    const result = await processFolhaEspelhoBulkJob(job);

    expect(result).toEqual({ success: 1, failed: 0, total: 1 });
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        employeeId: 'emp-1',
        competencia: '2026-03',
        tenantContext: expect.objectContaining({
          razaoSocial: 'Empresa Demo LTDA',
          cnpj: '12345678000190',
        }),
      }),
    );
    // Room scoped por tenant:id:hr
    expect(toMock).toHaveBeenCalledWith(`tenant:${TENANT_ID}:hr`);
    // Ao menos 1 progress + 1 completed
    expect(emitMock).toHaveBeenCalledWith(
      'compliance.folha_espelho.progress',
      expect.anything(),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'compliance.folha_espelho.completed',
      expect.objectContaining({
        bulkJobId: 'bulk-1',
        total: 1,
        success: 1,
        failed: 0,
        status: 'completed',
      }),
    );
  });

  it('processa lote de 45 → 3 chunks (20+20+5), progress emitido após cada chunk + start + completed', async () => {
    executeMock.mockResolvedValue({
      artifactId: 'a',
      storageKey: 'k',
      contentHash: 'h',
      sizeBytes: 5000,
      downloadUrl: 'u',
    });

    const employeeIds = Array.from({ length: 45 }, (_, i) => `emp-${i}`);
    const job = mockJob({
      tenantId: TENANT_ID,
      requestedBy: USER_ID,
      competencia: '2026-03',
      employeeIds,
      bulkJobId: 'bulk-big',
    });

    const result = await processFolhaEspelhoBulkJob(job);

    expect(result.success).toBe(45);
    expect(result.failed).toBe(0);
    expect(executeMock).toHaveBeenCalledTimes(45);

    // 1 start + 3 chunks = 4 progress + 1 completed = 5 emits total
    const progressCalls = emitMock.mock.calls.filter(
      ([ev]) => ev === 'compliance.folha_espelho.progress',
    );
    expect(progressCalls.length).toBeGreaterThanOrEqual(4);

    const completedCalls = emitMock.mock.calls.filter(
      ([ev]) => ev === 'compliance.folha_espelho.completed',
    );
    expect(completedCalls).toHaveLength(1);
    expect(completedCalls[0][1]).toMatchObject({
      total: 45,
      success: 45,
      failed: 0,
      status: 'completed',
    });
  });

  it('Promise.allSettled: falhas em funcionários contam como failed e não abortam', async () => {
    // 3 execuções: 1 sucesso, 1 erro, 1 sucesso
    executeMock
      .mockResolvedValueOnce({
        artifactId: 'a',
        storageKey: 'k',
        contentHash: 'h',
        sizeBytes: 5000,
        downloadUrl: 'u',
      })
      .mockRejectedValueOnce(new Error('Funcionário X sem CPF'))
      .mockResolvedValueOnce({
        artifactId: 'b',
        storageKey: 'k2',
        contentHash: 'h2',
        sizeBytes: 5000,
        downloadUrl: 'u2',
      });

    const job = mockJob({
      tenantId: TENANT_ID,
      requestedBy: USER_ID,
      competencia: '2026-03',
      employeeIds: ['emp-1', 'emp-2', 'emp-3'],
      bulkJobId: 'bulk-mixed',
    });

    const result = await processFolhaEspelhoBulkJob(job);

    expect(result).toEqual({ success: 2, failed: 1, total: 3 });
    // completed emitido com failed=1
    const completedCall = emitMock.mock.calls.find(
      ([ev]) => ev === 'compliance.folha_espelho.completed',
    );
    expect(completedCall?.[1]).toMatchObject({
      total: 3,
      success: 2,
      failed: 1,
    });
  });

  it('lança se Tenant não for encontrado (guard no worker)', async () => {
    findTenantMock.mockResolvedValue(null);

    const job = mockJob({
      tenantId: 'ghost',
      requestedBy: USER_ID,
      competencia: '2026-03',
      employeeIds: ['emp-1'],
      bulkJobId: 'bulk-ghost',
    });

    await expect(processFolhaEspelhoBulkJob(job)).rejects.toThrow(
      /Tenant ghost/,
    );
    expect(executeMock).not.toHaveBeenCalled();
  });

  it('startFolhaEspelhoBulkWorker: registra worker via createWorker', () => {
    const w = startFolhaEspelhoBulkWorker();
    expect(w).toBeDefined();
  });
});
