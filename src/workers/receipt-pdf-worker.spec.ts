import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks (Plan 04-05 lesson — captura de ref antes do vi.mock hoist).
const {
  findFirstArtifactMock,
  findUniqueTimeEntryMock,
  findUniqueTenantMock,
  findUniqueEsocialConfigMock,
  transactionMock,
  timeEntryUpdateManyMock,
  complianceArtifactCreateMock,
  uploadWithKeyMock,
} = vi.hoisted(() => ({
  findFirstArtifactMock: vi.fn(),
  findUniqueTimeEntryMock: vi.fn(),
  findUniqueTenantMock: vi.fn(),
  findUniqueEsocialConfigMock: vi.fn(),
  transactionMock: vi.fn().mockResolvedValue([]),
  timeEntryUpdateManyMock: vi.fn(),
  complianceArtifactCreateMock: vi.fn(),
  uploadWithKeyMock: vi.fn().mockResolvedValue({
    key: 'k',
    bucket: 'b',
    etag: '"et"',
    size: 100,
  }),
}));

vi.mock('@/@env', () => ({
  env: {
    NODE_ENV: 'test',
    RECEIPT_HMAC_KEY: undefined,
    PUBLIC_API_URL: undefined,
    S3_ENDPOINT: 'http://localhost',
    S3_BUCKET: 'test-bucket',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY_ID: 'test',
    S3_SECRET_ACCESS_KEY: 'test',
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    complianceArtifact: {
      findFirst: findFirstArtifactMock,
      create: complianceArtifactCreateMock,
    },
    timeEntry: {
      findUnique: findUniqueTimeEntryMock,
      updateMany: timeEntryUpdateManyMock,
    },
    tenant: { findUnique: findUniqueTenantMock },
    esocialConfig: { findUnique: findUniqueEsocialConfigMock },
    $transaction: transactionMock,
  },
}));

vi.mock('@/services/storage/s3-file-upload-service', () => ({
  S3FileUploadService: {
    getInstance: () => ({
      uploadWithKey: uploadWithKeyMock,
    }),
  },
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: { RECEIPT_PDF: 'receipt-pdf-generation' },
  createWorker: vi.fn((name, handler) => ({ name, handler })),
}));

import {
  processReceiptPdfJob,
  startReceiptPdfWorker,
} from './receipt-pdf-worker';

const happyTimeEntry = {
  id: 'te-1',
  tenantId: 'tenant-abc',
  employeeId: 'emp-1',
  nsrNumber: 1234,
  timestamp: new Date('2026-03-15T11:02:00Z'),
  entryType: 'CLOCK_IN',
  employee: {
    id: 'emp-1',
    fullName: 'JOÃO DA SILVA',
    socialName: null,
    registrationNumber: '99',
    department: { name: 'TI' },
  },
  punchApproval: null,
};

const happyTenant = {
  id: 'tenant-abc',
  name: 'Empresa Demo LTDA',
  settings: { cnpj: '12345678000190' },
};

describe('receipt-pdf-worker', () => {
  beforeEach(() => {
    findFirstArtifactMock.mockReset();
    findUniqueTimeEntryMock.mockReset();
    findUniqueTenantMock.mockReset();
    findUniqueEsocialConfigMock.mockReset();
    timeEntryUpdateManyMock.mockReset();
    complianceArtifactCreateMock.mockReset();
    uploadWithKeyMock.mockClear();
    transactionMock.mockClear();
    transactionMock.mockResolvedValue([]);
  });

  it('idempotency: skip se ComplianceArtifact já existe', async () => {
    findFirstArtifactMock.mockResolvedValue({ id: 'existing-artifact' });

    const result = await processReceiptPdfJob({
      timeEntryId: 'te-1',
      tenantId: 'tenant-abc',
    });

    expect(result).toEqual({ skipped: true });
    expect(findUniqueTimeEntryMock).not.toHaveBeenCalled();
    expect(uploadWithKeyMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('happy path: renderiza, upload R2 e grava tx (update+create)', async () => {
    findFirstArtifactMock.mockResolvedValue(null);
    findUniqueTimeEntryMock.mockResolvedValue(happyTimeEntry);
    findUniqueTenantMock.mockResolvedValue(happyTenant);
    findUniqueEsocialConfigMock.mockResolvedValue(null);

    const result = await processReceiptPdfJob({
      timeEntryId: 'te-1',
      tenantId: 'tenant-abc',
    });

    expect(result.success).toBe(true);
    expect(result.storageKey).toMatch(
      /^tenant-abc\/compliance\/recibo\/2026\/03\/[a-f0-9]{64}\.pdf$/,
    );
    expect(result.contentHash).toMatch(/^[a-f0-9]{64}$/);

    // uploadWithKey chamado com Buffer + cacheControl + metadata
    expect(uploadWithKeyMock).toHaveBeenCalledTimes(1);
    const [buf, key, opts] = uploadWithKeyMock.mock.calls[0];
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(key).toBe(result.storageKey);
    expect(opts).toMatchObject({
      mimeType: 'application/pdf',
      cacheControl: 'public, max-age=86400',
    });

    // $transaction([update, create]) chamado — atomicidade T-06-03-10
    expect(transactionMock).toHaveBeenCalledTimes(1);
  });

  it('falha loud quando TimeEntry não existe', async () => {
    findFirstArtifactMock.mockResolvedValue(null);
    findUniqueTimeEntryMock.mockResolvedValue(null);

    await expect(
      processReceiptPdfJob({
        timeEntryId: 'te-ghost',
        tenantId: 'tenant-abc',
      }),
    ).rejects.toThrow('TimeEntry te-ghost not found');
  });

  it('guard tenant cross-tenant: rejeita se tenantId do job difere do TimeEntry', async () => {
    findFirstArtifactMock.mockResolvedValue(null);
    findUniqueTimeEntryMock.mockResolvedValue({
      ...happyTimeEntry,
      tenantId: 'tenant-DIFFERENT',
    });

    await expect(
      processReceiptPdfJob({
        timeEntryId: 'te-1',
        tenantId: 'tenant-abc',
      }),
    ).rejects.toThrow(/belongs to another tenant/);
    expect(uploadWithKeyMock).not.toHaveBeenCalled();
  });

  it('skipa batida sem nsrNumber (Portaria exige NSR válido)', async () => {
    findFirstArtifactMock.mockResolvedValue(null);
    findUniqueTimeEntryMock.mockResolvedValue({
      ...happyTimeEntry,
      nsrNumber: null,
    });
    findUniqueTenantMock.mockResolvedValue(happyTenant);

    const result = await processReceiptPdfJob({
      timeEntryId: 'te-1',
      tenantId: 'tenant-abc',
    });
    expect(result).toEqual({ skipped: true });
  });

  it('S3 upload falha → propaga erro para BullMQ retry (Redis fallback tentado)', async () => {
    findFirstArtifactMock.mockResolvedValue(null);
    findUniqueTimeEntryMock.mockResolvedValue(happyTimeEntry);
    findUniqueTenantMock.mockResolvedValue(happyTenant);
    findUniqueEsocialConfigMock.mockResolvedValue(null);
    uploadWithKeyMock.mockRejectedValueOnce(new Error('R2 down'));

    await expect(
      processReceiptPdfJob({ timeEntryId: 'te-1', tenantId: 'tenant-abc' }),
    ).rejects.toThrow('R2 down');
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('hash determinismo: 2 runs com mesmo input → mesma storageKey', async () => {
    findFirstArtifactMock.mockResolvedValue(null);
    findUniqueTimeEntryMock.mockResolvedValue(happyTimeEntry);
    findUniqueTenantMock.mockResolvedValue(happyTenant);
    findUniqueEsocialConfigMock.mockResolvedValue(null);

    const r1 = await processReceiptPdfJob({
      timeEntryId: 'te-1',
      tenantId: 'tenant-abc',
    });
    uploadWithKeyMock.mockClear();
    const r2 = await processReceiptPdfJob({
      timeEntryId: 'te-1',
      tenantId: 'tenant-abc',
    });

    expect(r1.storageKey).toBe(r2.storageKey);
  });

  it('startReceiptPdfWorker: registra worker via createWorker', () => {
    const w = startReceiptPdfWorker();
    expect(w).toBeDefined();
  });
});
