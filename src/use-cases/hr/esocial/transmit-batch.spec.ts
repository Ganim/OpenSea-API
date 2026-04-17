import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Dependencies ───────────────���─────────────────────────���────────────

const {
  mockConfigFindUnique,
  mockCertFindUnique,
  mockEventFindMany,
  mockEventUpdate,
  mockEventUpdateMany,
  mockEventCount,
  mockBatchCreate,
  mockBatchUpdate,
} = vi.hoisted(() => ({
  mockConfigFindUnique: vi.fn(),
  mockCertFindUnique: vi.fn(),
  mockEventFindMany: vi.fn(),
  mockEventUpdate: vi.fn(),
  mockEventUpdateMany: vi.fn(),
  mockEventCount: vi.fn(),
  mockBatchCreate: vi.fn(),
  mockBatchUpdate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialConfig: { findUnique: mockConfigFindUnique },
    esocialCertificate: { findUnique: mockCertFindUnique },
    esocialEvent: {
      findMany: mockEventFindMany,
      update: mockEventUpdate,
      updateMany: mockEventUpdateMany,
      count: mockEventCount,
    },
    esocialBatch: {
      create: mockBatchCreate,
      update: mockBatchUpdate,
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
const mockParsePfx = vi.fn();
const mockIsExpired = vi.fn();
const mockDecrypt = vi.fn();

vi.mock('@/services/esocial/crypto/certificate-manager', () => ({
  CertificateManager: vi.fn().mockImplementation(() => ({
    parsePfx: mockParsePfx,
    isExpired: mockIsExpired,
    decrypt: mockDecrypt,
  })),
}));

// Mock XmlSigner
const mockSign = vi.fn();
vi.mock('@/services/esocial/crypto/xml-signer', () => ({
  XmlSigner: vi.fn().mockImplementation(() => ({
    sign: mockSign,
  })),
}));

// Mock SOAP client
const mockSendBatch = vi.fn();
vi.mock('@/services/esocial/transmitter/soap-client', () => ({
  EsocialSoapClient: vi.fn().mockImplementation(() => ({
    sendBatch: mockSendBatch,
  })),
}));

// Mock retry handler
vi.mock('@/services/esocial/transmitter/retry-handler', () => ({
  calculateNextRetry: vi.fn().mockReturnValue(new Date('2026-03-20T12:00:00Z')),
}));

import { TransmitBatchUseCase } from './transmit-batch';

// ─── Helpers ──────���───────────────────────────���──────────────────────────────

const TENANT_ID = 'tenant-transmit';
const USER_ID = 'user-transmitter';

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'config-1',
    tenantId: TENANT_ID,
    environment: 'HOMOLOGACAO',
    employerType: 'CNPJ',
    employerDocument: '12.345.678/0001-95',
    ...overrides,
  };
}

function makeCertificate(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cert-1',
    tenantId: TENANT_ID,
    encryptedPfx: Buffer.from('encrypted-pfx'),
    encryptionIv: 'iv-hex',
    encryptionTag: 'tag-hex',
    encryptedPassphrase: Buffer.from('encrypted-pass'),
    passphraseIv: 'pass-iv-hex',
    passphraseTag: 'pass-tag-hex',
    validUntil: new Date('2029-01-01'),
    ...overrides,
  };
}

function makeApprovedEvent(
  id: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    tenantId: TENANT_ID,
    eventType: 'S-2200',
    description: `Admissão ${id}`,
    status: 'APPROVED',
    xmlContent: `<xml>${id}</xml>`,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Tests ────���──────────────────────────────────────────────────────────────

describe('TransmitBatchUseCase', () => {
  let sut: TransmitBatchUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new TransmitBatchUseCase();
    // First decrypt call → PFX buffer; second → passphrase UTF-8.
    mockDecrypt
      .mockResolvedValueOnce(Buffer.from('decrypted-pfx'))
      .mockResolvedValueOnce(Buffer.from('my-passphrase', 'utf-8'));
    mockParsePfx.mockResolvedValue({
      privateKey: 'pem-key',
      certificate: 'pem-cert',
    });
    mockSign.mockImplementation(async (xml: string) => `signed:${xml}`);
    mockEventUpdate.mockResolvedValue({});
    mockBatchUpdate.mockResolvedValue({});
    // Default: no stale TRANSMITTING rows when checking for concurrent
    // runs. Tests that simulate the lock-held scenario override this.
    mockEventCount.mockResolvedValue(0);
  });

  it('should throw when config is not found', async () => {
    mockConfigFindUnique.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, userId: USER_ID }),
    ).rejects.toThrow('Configuração do eSocial não encontrada.');
  });

  it('should throw when certificate is not found', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(null);

    await expect(
      sut.execute({ tenantId: TENANT_ID, userId: USER_ID }),
    ).rejects.toThrow('Certificado digital não encontrado.');
  });

  it('should throw when certificate is expired', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(true);

    await expect(
      sut.execute({ tenantId: TENANT_ID, userId: USER_ID }),
    ).rejects.toThrow('Certificado digital expirado.');
  });

  it('should throw when no approved events exist', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(false);
    // Lock claim returns 0 — nothing to transmit AND no parallel run in
    // flight either.
    mockEventUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockEventCount.mockResolvedValueOnce(0);

    await expect(
      sut.execute({ tenantId: TENANT_ID, userId: USER_ID }),
    ).rejects.toThrow('Nenhum evento aprovado encontrado para transmissão.');
  });

  it('should throw with a clear message when another transmission is already in flight', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(false);
    // Lock claim grabbed 0 rows — everything is already claimed by a
    // concurrent caller (count > 0 in TRANSMITTING state).
    mockEventUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockEventCount.mockResolvedValueOnce(5);

    await expect(
      sut.execute({ tenantId: TENANT_ID, userId: USER_ID }),
    ).rejects.toThrow('Transmissão já em andamento');
  });

  it('should transmit a batch of approved events successfully', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(false);
    // First updateMany (lock claim) grabs 2 rows; the trailing
    // updateMany in the cleanup step returns 0.
    mockEventUpdateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 0 });
    mockEventFindMany.mockResolvedValue([
      makeApprovedEvent('ev-1', { status: 'TRANSMITTING' }),
      makeApprovedEvent('ev-2', { status: 'TRANSMITTING' }),
    ]);
    mockBatchCreate.mockResolvedValue({
      id: 'batch-new-1',
      tenantId: TENANT_ID,
    });
    mockSendBatch.mockResolvedValue({ protocol: 'PROT-SENT-001' });

    const results = await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    expect(results).toHaveLength(1);
    expect(results[0].batchId).toBe('batch-new-1');
    expect(results[0].protocol).toBe('PROT-SENT-001');
    expect(results[0].eventCount).toBe(2);
    expect(results[0].status).toBe('TRANSMITTED');

    // Verify batch was created
    expect(mockBatchCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: TENANT_ID,
        status: 'TRANSMITTING',
        environment: 'HOMOLOGACAO',
        totalEvents: 2,
        createdBy: USER_ID,
      }),
    });

    // Verify batch was updated with protocol
    expect(mockBatchUpdate).toHaveBeenCalledWith({
      where: { id: 'batch-new-1' },
      data: expect.objectContaining({
        protocol: 'PROT-SENT-001',
        status: 'TRANSMITTED',
        transmittedAt: expect.any(Date),
      }),
    });
  });

  it('should sign each event XML before transmission', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(false);
    mockEventUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    mockEventFindMany.mockResolvedValue([
      makeApprovedEvent('ev-1', { status: 'TRANSMITTING' }),
    ]);
    mockBatchCreate.mockResolvedValue({ id: 'batch-1' });
    mockSendBatch.mockResolvedValue({ protocol: 'P-1' });

    await sut.execute({ tenantId: TENANT_ID, userId: USER_ID });

    // Verify XML was signed
    expect(mockSign).toHaveBeenCalledWith(
      '<xml>ev-1</xml>',
      'pem-key',
      'pem-cert',
    );

    // Verify event was updated with signed XML
    expect(mockEventUpdate).toHaveBeenCalledWith({
      where: { id: 'ev-1' },
      data: expect.objectContaining({
        signedXml: 'signed:<xml>ev-1</xml>',
        status: 'TRANSMITTING',
        batchId: 'batch-1',
      }),
    });
  });

  it('should skip events without xmlContent during signing', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(false);
    mockEventUpdateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 0 });
    mockEventFindMany.mockResolvedValue([
      makeApprovedEvent('ev-1', { status: 'TRANSMITTING' }),
      makeApprovedEvent('ev-2', { status: 'TRANSMITTING', xmlContent: null }),
    ]);
    mockBatchCreate.mockResolvedValue({ id: 'batch-1' });
    mockSendBatch.mockResolvedValue({ protocol: 'P-1' });

    const results = await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    // Only ev-1 should have been signed
    expect(mockSign).toHaveBeenCalledTimes(1);
    expect(results[0].eventCount).toBe(1); // Only 1 signed event
  });

  it('should handle SOAP transmission error gracefully', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(false);
    // 1st updateMany = lock claim (1 row), 2nd = revert on SOAP error,
    // 3rd = cleanup of stale TRANSMITTING rows at end.
    mockEventUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    mockEventFindMany.mockResolvedValue([
      makeApprovedEvent('ev-1', { status: 'TRANSMITTING' }),
    ]);
    mockBatchCreate.mockResolvedValue({ id: 'batch-err' });
    mockSendBatch.mockRejectedValue(
      new Error('Connection timeout to government API'),
    );

    const results = await sut.execute({
      tenantId: TENANT_ID,
      userId: USER_ID,
    });

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('ERROR');
    expect(results[0].batchId).toBe('batch-err');

    // Batch should be updated with error
    expect(mockBatchUpdate).toHaveBeenCalledWith({
      where: { id: 'batch-err' },
      data: expect.objectContaining({
        status: 'ERROR',
        errorMessage: 'Connection timeout to government API',
        retryCount: 1,
      }),
    });

    // Events should be reverted to APPROVED
    expect(mockEventUpdateMany).toHaveBeenCalledWith({
      where: { batchId: 'batch-err' },
      data: expect.objectContaining({
        status: 'APPROVED',
        batchId: null,
        retryCount: { increment: 1 },
      }),
    });
  });

  it('should lock APPROVED events for the tenant via updateMany (idempotency guard)', async () => {
    mockConfigFindUnique.mockResolvedValue(makeConfig());
    mockCertFindUnique.mockResolvedValue(makeCertificate());
    mockIsExpired.mockReturnValue(false);
    mockEventUpdateMany.mockResolvedValueOnce({ count: 0 });
    mockEventCount.mockResolvedValueOnce(0);

    await expect(
      sut.execute({ tenantId: TENANT_ID, userId: USER_ID }),
    ).rejects.toThrow('Nenhum evento aprovado');

    // The FIRST write must be the atomic APPROVED → TRANSMITTING claim.
    // This is the P0-07 lock: two concurrent callers cannot both pass
    // this point with the same events.
    expect(mockEventUpdateMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID, status: 'APPROVED' },
      data: { status: 'TRANSMITTING' },
    });
  });
});
