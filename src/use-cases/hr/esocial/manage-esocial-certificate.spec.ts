import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Dependencies ──────────────────────────────────────────────────────

const { mockCertFindUnique, mockCertUpsert } = vi.hoisted(() => ({
  mockCertFindUnique: vi.fn(),
  mockCertUpsert: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialCertificate: {
      findUnique: mockCertFindUnique,
      upsert: mockCertUpsert,
    },
  },
}));

vi.mock('@/@env', () => ({
  env: {
    ESOCIAL_ENCRYPTION_KEY: 'test-encryption-key-32chars-ok!',
    JWT_SECRET: 'jwt-secret-fallback',
  },
}));

// Mock CertificateManager
const mockParsePfx = vi.fn();
const mockIsExpired = vi.fn();
const mockEncrypt = vi.fn();
const mockDaysUntilExpiry = vi.fn();

vi.mock('@/services/esocial/crypto/certificate-manager', () => ({
  CertificateManager: vi.fn().mockImplementation(() => ({
    parsePfx: mockParsePfx,
    isExpired: mockIsExpired,
    encrypt: mockEncrypt,
    daysUntilExpiry: mockDaysUntilExpiry,
  })),
}));

import {
  GetEsocialCertificateUseCase,
  UploadEsocialCertificateUseCase,
} from './manage-esocial-certificate';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-certificate';

function makeCertificateRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cert-1',
    tenantId: TENANT_ID,
    encryptedPfx: Buffer.from('encrypted-pfx-data'),
    encryptionIv: 'abc123iv',
    encryptionTag: 'abc123tag',
    serialNumber: 'SN-1234567890',
    issuer: 'CN=ICP-Brasil, O=Autoridade Certificadora',
    subject: 'CN=Empresa Demo LTDA, OU=RH',
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    validUntil: new Date('2028-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-15T10:00:00.000Z'),
    updatedAt: new Date('2026-01-15T10:00:00.000Z'),
    ...overrides,
  };
}

// ─── UploadEsocialCertificateUseCase ─────────────────────────────────────────

describe('UploadEsocialCertificateUseCase', () => {
  let sut: UploadEsocialCertificateUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new UploadEsocialCertificateUseCase();
  });

  it('should upload and store a valid certificate', async () => {
    const pfxBuffer = Buffer.from('fake-pfx-content');
    const certInfo = {
      privateKey: 'pem-private-key',
      certificate: 'pem-certificate',
      serialNumber: 'SN-NEW-001',
      issuer: 'CN=ICP-Brasil',
      subject: 'CN=Empresa XYZ',
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2029-01-01'),
    };
    const encryptedData = {
      encrypted: Buffer.from('encrypted'),
      iv: 'hex-iv',
      authTag: 'hex-tag',
    };

    mockParsePfx.mockResolvedValue(certInfo);
    mockIsExpired.mockReturnValue(false);
    mockEncrypt.mockResolvedValue(encryptedData);
    mockDaysUntilExpiry.mockReturnValue(1095);
    mockCertUpsert.mockResolvedValue(
      makeCertificateRecord({
        serialNumber: 'SN-NEW-001',
        issuer: 'CN=ICP-Brasil',
        subject: 'CN=Empresa XYZ',
        validFrom: new Date('2026-01-01'),
        validUntil: new Date('2029-01-01'),
      }),
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      pfxBuffer,
      passphrase: 'my-password',
    });

    expect(result.certificate.serialNumber).toBe('SN-NEW-001');
    expect(result.certificate.issuer).toBe('CN=ICP-Brasil');
    expect(result.certificate.subject).toBe('CN=Empresa XYZ');
    expect(result.certificate.daysLeft).toBe(1095);
    expect(result.certificate.isExpired).toBe(false);

    // Verify PFX was parsed with correct passphrase
    expect(mockParsePfx).toHaveBeenCalledWith(pfxBuffer, 'my-password');

    // Verify encryption was called
    expect(mockEncrypt).toHaveBeenCalledWith(
      pfxBuffer,
      'test-encryption-key-32chars-ok!',
    );

    // Verify upsert was called with encrypted data
    expect(mockCertUpsert).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID },
      create: expect.objectContaining({
        tenantId: TENANT_ID,
        encryptedPfx: encryptedData.encrypted,
        encryptionIv: 'hex-iv',
        encryptionTag: 'hex-tag',
        serialNumber: 'SN-NEW-001',
      }),
      update: expect.objectContaining({
        encryptedPfx: encryptedData.encrypted,
        serialNumber: 'SN-NEW-001',
      }),
    });
  });

  it('should throw when certificate is already expired', async () => {
    const pfxBuffer = Buffer.from('expired-pfx');
    mockParsePfx.mockResolvedValue({
      serialNumber: 'SN-EXPIRED',
      validUntil: new Date('2024-01-01'),
    });
    mockIsExpired.mockReturnValue(true);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        pfxBuffer,
        passphrase: 'pass',
      }),
    ).rejects.toThrow('O certificado enviado já está expirado.');

    // Should NOT encrypt or store
    expect(mockEncrypt).not.toHaveBeenCalled();
    expect(mockCertUpsert).not.toHaveBeenCalled();
  });

  it('should return ISO date strings', async () => {
    const validFrom = new Date('2026-06-01T00:00:00.000Z');
    const validUntil = new Date('2029-06-01T00:00:00.000Z');
    const createdAt = new Date('2026-06-10T08:30:00.000Z');

    mockParsePfx.mockResolvedValue({
      serialNumber: 'SN-1',
      issuer: 'I',
      subject: 'S',
      validFrom,
      validUntil,
    });
    mockIsExpired.mockReturnValue(false);
    mockEncrypt.mockResolvedValue({
      encrypted: Buffer.from('e'),
      iv: 'i',
      authTag: 'a',
    });
    mockDaysUntilExpiry.mockReturnValue(1095);
    mockCertUpsert.mockResolvedValue(
      makeCertificateRecord({ validFrom, validUntil, createdAt }),
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      pfxBuffer: Buffer.from('pfx'),
      passphrase: 'p',
    });

    expect(result.certificate.validFrom).toBe('2026-06-01T00:00:00.000Z');
    expect(result.certificate.validUntil).toBe('2029-06-01T00:00:00.000Z');
    expect(result.certificate.createdAt).toBe('2026-06-10T08:30:00.000Z');
  });
});

// ─── GetEsocialCertificateUseCase ────────────────────────────────────────────

describe('GetEsocialCertificateUseCase', () => {
  let sut: GetEsocialCertificateUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetEsocialCertificateUseCase();
  });

  it('should return certificate info when one exists', async () => {
    mockCertFindUnique.mockResolvedValue(makeCertificateRecord());
    mockDaysUntilExpiry.mockReturnValue(730);
    mockIsExpired.mockReturnValue(false);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result).not.toBeNull();
    expect(result!.certificate.id).toBe('cert-1');
    expect(result!.certificate.serialNumber).toBe('SN-1234567890');
    expect(result!.certificate.daysLeft).toBe(730);
    expect(result!.certificate.isExpired).toBe(false);
  });

  it('should return null when no certificate exists', async () => {
    mockCertFindUnique.mockResolvedValue(null);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result).toBeNull();
  });

  it('should query by tenantId', async () => {
    mockCertFindUnique.mockResolvedValue(null);

    await sut.execute({ tenantId: TENANT_ID });

    expect(mockCertFindUnique).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID },
    });
  });

  it('should return ISO date strings for dates', async () => {
    mockCertFindUnique.mockResolvedValue(
      makeCertificateRecord({
        validFrom: new Date('2025-01-01T00:00:00.000Z'),
        validUntil: new Date('2028-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
      }),
    );
    mockDaysUntilExpiry.mockReturnValue(365);
    mockIsExpired.mockReturnValue(false);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result!.certificate.validFrom).toBe('2025-01-01T00:00:00.000Z');
    expect(result!.certificate.validUntil).toBe('2028-01-01T00:00:00.000Z');
    expect(result!.certificate.createdAt).toBe('2026-01-15T10:00:00.000Z');
  });
});
