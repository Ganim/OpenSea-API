import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Dependencies ──────────────────────────────────────────────────────

const {
  mockBatchFindFirst,
  mockConfigFindUnique,
  mockCertFindUnique,
  mockEventUpdate,
  mockBatchUpdate,
} = vi.hoisted(() => ({
  mockBatchFindFirst: vi.fn(),
  mockConfigFindUnique: vi.fn(),
  mockCertFindUnique: vi.fn(),
  mockEventUpdate: vi.fn(),
  mockBatchUpdate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialBatch: {
      findFirst: mockBatchFindFirst,
      update: mockBatchUpdate,
    },
    esocialConfig: {
      findUnique: mockConfigFindUnique,
    },
    esocialCertificate: {
      findUnique: mockCertFindUnique,
    },
    esocialEvent: {
      update: mockEventUpdate,
    },
  },
}));

vi.mock('@/@env', () => ({
  env: {
    ESOCIAL_ENCRYPTION_KEY: 'test-key-32-chars-minimum!!!!!!',
    JWT_SECRET: 'jwt-fallback',
  },
}));

// Mock CertificateManager
const mockDecrypt = vi.fn();
vi.mock('@/services/esocial/crypto/certificate-manager', () => ({
  CertificateManager: vi.fn().mockImplementation(() => ({
    decrypt: mockDecrypt,
  })),
}));

// Mock SOAP client
const mockCheckBatchStatus = vi.fn();
vi.mock('@/services/esocial/transmitter/soap-client', () => ({
  EsocialSoapClient: vi.fn().mockImplementation(() => ({
    checkBatchStatus: mockCheckBatchStatus,
  })),
}));

// Mock retry handler
vi.mock('@/services/esocial/transmitter/retry-handler', () => ({
  calculateNextRetry: vi.fn().mockReturnValue(new Date('2026-03-20T12:00:00Z')),
}));

import { CheckBatchStatusUseCase } from './check-batch-status';

// ─── Helpers ��────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-check-batch';
const BATCH_ID = 'batch-check-1';

function makeBatchWithEvents() {
  return {
    id: BATCH_ID,
    tenantId: TENANT_ID,
    protocol: 'PROT-ABC-123',
    status: 'TRANSMITTED',
    environment: 'HOMOLOGACAO',
    totalEvents: 2,
    events: [
      { id: 'ev-1', retryCount: 0 },
      { id: 'ev-2', retryCount: 0 },
    ],
  };
}

function makeConfig() {
  return {
    id: 'config-1',
    tenantId: TENANT_ID,
    environment: 'HOMOLOGACAO',
  };
}

function makeCertificate() {
  return {
    id: 'cert-1',
    tenantId: TENANT_ID,
    encryptedPfx: Buffer.from('encrypted'),
    encryptionIv: 'iv-hex',
    encryptionTag: 'tag-hex',
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CheckBatchStatusUseCase', () => {
  let sut: CheckBatchStatusUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new CheckBatchStatusUseCase();
    mockDecrypt.mockResolvedValue(Buffer.from('decrypted-pfx'));
    mockEventUpdate.mockResolvedValue({});
    mockBatchUpdate.mockResolvedValue({});
  });

  it('should throw when batch is not found', async () => {
    mockBatchFindFirst.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, batchId: BATCH_ID }),
    ).rejects.toThrow('Lote não encontrado.');
  });

  it('should throw when batch has no protocol', async () => {
    mockBatchFindFirst.mockResolvedValue({
      ...makeBatchWithEvents(),
      protocol: null,
    });

    await expect(
      sut.execute({ tenantId: TENANT_ID, batchId: BATCH_ID }),
    ).rejects.toThrow('Lote não possui protocolo. Transmita o lote primeiro.');
  });

  it('should throw when config is not found', async () => {
    mockBatchFindFirst.mockResolvedValue(makeBatchWithEvents());
    mockConfigFindUnique.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, batchId: BATCH_ID }),
    ).rejects.toThrow('Configuração do eSocial não encontrada.');
  });

  it('should throw when certificate is not found', async () => {
    mockBatchFindFirst.mockResolvedValue(makeBatchWithEvents());
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, batchId: BATCH_ID }),
    ).rejects.toThrow('Certificado digital não encontrado.');
  });

  it('should mark all events as ACCEPTED when SOAP returns receipts', async () => {
    mockBatchFindFirst.mockResolvedValue(makeBatchWithEvents());
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockCheckBatchStatus.mockResolvedValue({
      events: [
        { id: 'ev-1', receipt: 'REC-001', rejectionCode: null },
        { id: 'ev-2', receipt: 'REC-002', rejectionCode: null },
      ],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(result.acceptedCount).toBe(2);
    expect(result.rejectedCount).toBe(0);
    expect(result.status).toBe('ACCEPTED');
    expect(result.events).toHaveLength(2);
    expect(result.events[0].status).toBe('ACCEPTED');
    expect(result.events[0].receipt).toBe('REC-001');

    // Verify batch was updated
    expect(mockBatchUpdate).toHaveBeenCalledWith({
      where: { id: BATCH_ID },
      data: expect.objectContaining({
        status: 'ACCEPTED',
        acceptedCount: 2,
        rejectedCount: 0,
        checkedAt: expect.any(Date),
      }),
    });
  });

  it('should mark all events as REJECTED when SOAP returns rejection codes', async () => {
    mockBatchFindFirst.mockResolvedValue(makeBatchWithEvents());
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockCheckBatchStatus.mockResolvedValue({
      events: [
        {
          id: 'ev-1',
          receipt: null,
          rejectionCode: 'ERR-100',
          rejectionMessage: 'CPF inválido',
        },
        {
          id: 'ev-2',
          receipt: null,
          rejectionCode: 'ERR-200',
          rejectionMessage: 'Data inconsistente',
        },
      ],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(result.acceptedCount).toBe(0);
    expect(result.rejectedCount).toBe(2);
    expect(result.status).toBe('REJECTED');

    expect(mockEventUpdate).toHaveBeenCalledWith({
      where: { id: 'ev-1' },
      data: expect.objectContaining({
        status: 'REJECTED',
        rejectionCode: 'ERR-100',
        retryCount: { increment: 1 },
      }),
    });
  });

  it('should mark batch as PARTIALLY_ACCEPTED when mixed results', async () => {
    mockBatchFindFirst.mockResolvedValue(makeBatchWithEvents());
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockCheckBatchStatus.mockResolvedValue({
      events: [
        { id: 'ev-1', receipt: 'REC-001', rejectionCode: null },
        {
          id: 'ev-2',
          receipt: null,
          rejectionCode: 'ERR-300',
          rejectionMessage: 'Erro no campo',
        },
      ],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(result.acceptedCount).toBe(1);
    expect(result.rejectedCount).toBe(1);
    expect(result.status).toBe('PARTIALLY_ACCEPTED');
  });

  it('should keep original status when no events processed', async () => {
    const batch = makeBatchWithEvents();
    mockBatchFindFirst.mockResolvedValue(batch);
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockCheckBatchStatus.mockResolvedValue({ events: [] });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(result.status).toBe('TRANSMITTED'); // keeps original
    expect(result.acceptedCount).toBe(0);
    expect(result.rejectedCount).toBe(0);
  });

  it('should call SOAP client with correct parameters', async () => {
    mockBatchFindFirst.mockResolvedValue(makeBatchWithEvents());
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockCheckBatchStatus.mockResolvedValue({ events: [] });

    await sut.execute({ tenantId: TENANT_ID, batchId: BATCH_ID });

    expect(mockCheckBatchStatus).toHaveBeenCalledWith(
      'PROT-ABC-123',
      'HOMOLOGACAO',
      { pfx: expect.any(Buffer), passphrase: '' },
    );
  });

  it('should skip SOAP response events not matching batch events', async () => {
    mockBatchFindFirst.mockResolvedValue(makeBatchWithEvents());
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockCheckBatchStatus.mockResolvedValue({
      events: [{ id: 'ev-unknown', receipt: 'REC-X', rejectionCode: null }],
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      batchId: BATCH_ID,
    });

    expect(result.acceptedCount).toBe(0);
    expect(result.rejectedCount).toBe(0);
    expect(result.events).toHaveLength(0);
    expect(mockEventUpdate).not.toHaveBeenCalled();
  });
});
