vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/email/imap-client.service', () => ({
  createImapClient: vi.fn(),
}));

vi.mock('@/services/email/imap-idle-manager', () => ({
  getImapIdleManager: vi.fn(() => ({
    getStatus: vi.fn(() => 'idle'),
  })),
}));

vi.mock('@/workers/queues/email-sync.queue', () => ({
  getEmailSyncQueueInstance: vi.fn(() => ({
    getJobs: vi.fn().mockResolvedValue([]),
  })),
}));

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { createImapClient } from '@/services/email/imap-client.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckEmailAccountHealthUseCase } from './check-email-account-health';

const tenantId = 'tenant-1';
const userId = 'user-1';

function makeMocks() {
  const emailAccountsRepository = new InMemoryEmailAccountsRepository();

  const credentialCipherService = {
    decrypt: vi.fn(() => 'decrypted-secret'),
  } as unknown;

  const smtpClientService = {
    testConnection: vi.fn().mockResolvedValue(undefined),
  } as unknown;

  const sut = new CheckEmailAccountHealthUseCase(
    emailAccountsRepository,
    credentialCipherService,
    smtpClientService,
  );

  return {
    sut,
    emailAccountsRepository,
    credentialCipherService,
    smtpClientService,
  };
}

describe('CheckEmailAccountHealthUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = makeMocks();

    vi.mocked(createImapClient).mockReturnValue({
      connect: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
      logout: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('should return health status for account owner', async () => {
    const account = await mocks.emailAccountsRepository.create({
      tenantId,
      ownerUserId: userId,
      address: 'test@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 465,
      smtpSecure: true,
      username: 'test@example.com',
      encryptedSecret: 'encrypted',
    });

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      accountId: account.id.toString(),
    });

    expect(result.imap).toBeDefined();
    expect(result.smtp).toBeDefined();
    expect(result.worker).toBeDefined();
    expect(result.imap.status).toBe('connected');
    expect(result.smtp.status).toBe('connected');
  });

  it('should throw ResourceNotFoundError when account does not exist', async () => {
    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        accountId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when user is not owner and has no manage access', async () => {
    const account = await mocks.emailAccountsRepository.create({
      tenantId,
      ownerUserId: 'other-user',
      address: 'other@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 465,
      username: 'other@example.com',
      encryptedSecret: 'encrypted',
    });

    await expect(
      mocks.sut.execute({
        tenantId,
        userId,
        accountId: account.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should allow access for user with canManage access', async () => {
    const account = await mocks.emailAccountsRepository.create({
      tenantId,
      ownerUserId: 'other-user',
      address: 'shared@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 465,
      username: 'shared@example.com',
      encryptedSecret: 'encrypted',
    });

    await mocks.emailAccountsRepository.upsertAccess({
      accountId: account.id.toString(),
      tenantId,
      userId,
      canRead: true,
      canManage: true,
    });

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      accountId: account.id.toString(),
    });

    expect(result.imap.status).toBe('connected');
    expect(result.smtp.status).toBe('connected');
  });

  it('should report IMAP error when connection fails', async () => {
    vi.mocked(createImapClient).mockReturnValue({
      connect: vi.fn().mockRejectedValue(new Error('Connection refused')),
      logout: vi.fn().mockResolvedValue(undefined),
    });

    const account = await mocks.emailAccountsRepository.create({
      tenantId,
      ownerUserId: userId,
      address: 'test@example.com',
      imapHost: 'bad-imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 465,
      username: 'test@example.com',
      encryptedSecret: 'encrypted',
    });

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      accountId: account.id.toString(),
    });

    expect(result.imap.status).toBe('error');
    expect(result.imap.error).toBe('Connection refused');
    expect(result.smtp.status).toBe('connected');
  });

  it('should report SMTP error when connection test fails', async () => {
    mocks.smtpClientService.testConnection.mockRejectedValue(
      new Error('SMTP auth failed'),
    );

    const account = await mocks.emailAccountsRepository.create({
      tenantId,
      ownerUserId: userId,
      address: 'test@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'bad-smtp.example.com',
      smtpPort: 465,
      username: 'test@example.com',
      encryptedSecret: 'encrypted',
    });

    const result = await mocks.sut.execute({
      tenantId,
      userId,
      accountId: account.id.toString(),
    });

    expect(result.imap.status).toBe('connected');
    expect(result.smtp.status).toBe('error');
    expect(result.smtp.error).toBe('SMTP auth failed');
  });
});
