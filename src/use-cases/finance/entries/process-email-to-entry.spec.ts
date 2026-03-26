import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcessEmailToEntryUseCase } from './process-email-to-entry';
import type { OcrExtractDataUseCase, OcrExtractResult } from './ocr-extract-data';
import type { CreateFinanceEntryUseCase } from './create-finance-entry';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';

// ============================================================================
// MOCKS
// ============================================================================

// Mock prisma
const mockPrismaEmailToEntryConfig = {
  findUnique: vi.fn(),
  update: vi.fn(),
};

const mockPrismaEmailAccount = {
  findFirst: vi.fn(),
};

const mockPrismaCostCenter = {
  findFirst: vi.fn(),
};

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailToEntryConfig: {
      findUnique: (...args: unknown[]) => mockPrismaEmailToEntryConfig.findUnique(...args),
      update: (...args: unknown[]) => mockPrismaEmailToEntryConfig.update(...args),
    },
    emailAccount: {
      findFirst: (...args: unknown[]) => mockPrismaEmailAccount.findFirst(...args),
    },
    costCenter: {
      findFirst: (...args: unknown[]) => mockPrismaCostCenter.findFirst(...args),
    },
  },
}));

// Mock IMAP connection pool
vi.mock('@/services/email/imap-connection-pool', () => ({
  getImapConnectionPool: () => ({
    acquire: vi.fn().mockResolvedValue(mockImapClient),
    release: vi.fn(),
    destroy: vi.fn(),
  }),
}));

const mockImapClient = {
  getMailboxLock: vi.fn(),
  fetch: vi.fn(),
  download: vi.fn(),
  messageFlagsAdd: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// ============================================================================
// HELPERS
// ============================================================================

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'config-1',
    tenantId: 'tenant-1',
    emailAccountId: 'account-1',
    monitoredFolder: 'INBOX/Financeiro',
    isActive: true,
    autoCreate: true,
    defaultType: 'PAYABLE',
    defaultCategoryId: 'category-1',
    processedCount: 0,
    lastProcessedAt: null,
    ...overrides,
  };
}

function makeAccount() {
  return {
    id: 'account-1',
    tenantId: 'tenant-1',
    isActive: true,
    imapHost: 'imap.test.com',
    imapPort: 993,
    imapSecure: true,
    username: 'user@test.com',
    encryptedSecret: 'encrypted-secret',
    tlsVerify: false,
  };
}

function makeMockOcrUseCase(result?: Partial<OcrExtractResult>): OcrExtractDataUseCase {
  return {
    execute: vi.fn().mockResolvedValue({
      rawText: 'test text',
      extractedData: {
        valor: 150.0,
        vencimento: '2026-04-15',
        beneficiario: 'Fornecedor ABC',
        ...result?.extractedData,
      },
      confidence: 0.9,
      ...result,
    }),
  } as unknown as OcrExtractDataUseCase;
}

function makeMockCreateEntryUseCase(): CreateFinanceEntryUseCase {
  return {
    execute: vi.fn().mockResolvedValue({
      entry: { id: 'entry-1', description: 'Test Entry' },
    }),
  } as unknown as CreateFinanceEntryUseCase;
}

function makeMockCredentialCipher(): CredentialCipherService {
  return {
    decryptWithRotation: vi.fn().mockReturnValue({
      plainText: 'decrypted-password',
      needsReEncrypt: false,
    }),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  } as unknown as CredentialCipherService;
}

// ============================================================================
// TESTS
// ============================================================================

describe('ProcessEmailToEntryUseCase', () => {
  let ocrUseCase: OcrExtractDataUseCase;
  let createEntryUseCase: CreateFinanceEntryUseCase;
  let credentialCipher: CredentialCipherService;
  let sut: ProcessEmailToEntryUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    ocrUseCase = makeMockOcrUseCase();
    createEntryUseCase = makeMockCreateEntryUseCase();
    credentialCipher = makeMockCredentialCipher();
    sut = new ProcessEmailToEntryUseCase(ocrUseCase, createEntryUseCase, credentialCipher);
  });

  it('should return empty results when no config exists', async () => {
    mockPrismaEmailToEntryConfig.findUnique.mockResolvedValue(null);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.processed).toBe(0);
    expect(result.created).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it('should return empty results when config is inactive', async () => {
    mockPrismaEmailToEntryConfig.findUnique.mockResolvedValue(
      makeConfig({ isActive: false }),
    );

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.processed).toBe(0);
    expect(result.created).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it('should return empty results when email account not found', async () => {
    mockPrismaEmailToEntryConfig.findUnique.mockResolvedValue(makeConfig());
    mockPrismaEmailAccount.findFirst.mockResolvedValue(null);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.processed).toBe(0);
    expect(result.created).toBe(0);
  });

  it('should process email with PDF attachment and create entry', async () => {
    mockPrismaEmailToEntryConfig.findUnique.mockResolvedValue(makeConfig());
    mockPrismaEmailAccount.findFirst.mockResolvedValue(makeAccount());
    mockPrismaCostCenter.findFirst.mockResolvedValue({ id: 'cc-1', isActive: true });

    const mockLock = { release: vi.fn() };
    mockImapClient.getMailboxLock.mockResolvedValue(mockLock);

    // Mock fetch to return one message with PDF attachment
    const message = {
      uid: 1,
      flags: new Set<string>(), // unseen
      envelope: {
        subject: 'NF - Fornecedor ABC',
        messageId: '<msg-1@test.com>',
      },
      bodyStructure: {
        type: 'multipart',
        subtype: 'mixed',
        childNodes: [
          {
            type: 'text',
            subtype: 'plain',
            part: '1',
          },
          {
            type: 'application',
            subtype: 'pdf',
            part: '2',
            parameters: { name: 'boleto.pdf' },
            disposition: { type: 'attachment' },
          },
        ],
      },
    };

    // Make fetch return an async iterable
    mockImapClient.fetch.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield message;
      },
    });

    // Mock download
    mockImapClient.download.mockResolvedValue({
      content: {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('PDF content');
        },
      },
    });

    mockPrismaEmailToEntryConfig.update.mockResolvedValue(makeConfig());

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.created).toBe(1);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].status).toBe('created');
    expect(createEntryUseCase.execute).toHaveBeenCalledTimes(1);
    expect(mockLock.release).toHaveBeenCalled();
  });

  it('should skip emails without attachments', async () => {
    mockPrismaEmailToEntryConfig.findUnique.mockResolvedValue(makeConfig());
    mockPrismaEmailAccount.findFirst.mockResolvedValue(makeAccount());

    const mockLock = { release: vi.fn() };
    mockImapClient.getMailboxLock.mockResolvedValue(mockLock);

    const message = {
      uid: 1,
      flags: new Set<string>(),
      envelope: {
        subject: 'Newsletter update',
        messageId: '<msg-2@test.com>',
      },
      bodyStructure: {
        type: 'text',
        subtype: 'plain',
        part: '1',
      },
    };

    mockImapClient.fetch.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield message;
      },
    });

    mockPrismaEmailToEntryConfig.update.mockResolvedValue(makeConfig());

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.skipped).toBe(1);
    expect(result.created).toBe(0);
    expect(createEntryUseCase.execute).not.toHaveBeenCalled();
  });

  it('should handle OCR failure gracefully and use metadata fallback', async () => {
    mockPrismaEmailToEntryConfig.findUnique.mockResolvedValue(makeConfig());
    mockPrismaEmailAccount.findFirst.mockResolvedValue(makeAccount());
    mockPrismaCostCenter.findFirst.mockResolvedValue({ id: 'cc-1', isActive: true });

    const mockLock = { release: vi.fn() };
    mockImapClient.getMailboxLock.mockResolvedValue(mockLock);

    const message = {
      uid: 1,
      flags: new Set<string>(),
      envelope: {
        subject: 'Boleto R$ 500,00 vencimento 15/04/2026',
        messageId: '<msg-3@test.com>',
      },
      bodyStructure: {
        type: 'multipart',
        subtype: 'mixed',
        childNodes: [
          {
            type: 'image',
            subtype: 'jpeg',
            part: '2',
            parameters: { name: 'boleto.jpg' },
          },
        ],
      },
    };

    mockImapClient.fetch.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield message;
      },
    });

    // First call (buffer mode) throws, second call (text mode) works
    let callCount = 0;
    (ocrUseCase.execute as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('OCR failed');
      }
      // Fallback text extraction from subject
      return {
        rawText: 'Boleto R$ 500,00 vencimento 15/04/2026',
        extractedData: { valor: 500, vencimento: '2026-04-15' },
        confidence: 1.0,
      };
    });

    mockImapClient.download.mockResolvedValue({
      content: {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('fake image data');
        },
      },
    });

    mockPrismaEmailToEntryConfig.update.mockResolvedValue(makeConfig());

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.created).toBe(1);
    expect(ocrUseCase.execute).toHaveBeenCalledTimes(2);
  });
});
