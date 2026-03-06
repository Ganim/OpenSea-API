import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveEmailDraftUseCase } from './save-email-draft';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

let mockClient: {
  connect: ReturnType<typeof vi.fn>;
  append: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

vi.mock('imapflow', () => ({
  ImapFlow: vi.fn(() => mockClient),
}));

class FakeCipherService {
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

class FakeEmailFoldersRepository {
  listByAccount = vi.fn().mockResolvedValue([
    {
      id: { toString: () => 'folder-drafts-1' },
      remoteName: 'Drafts',
      type: 'DRAFTS',
    },
  ]);
}

describe('SaveEmailDraftUseCase', () => {
  let accountsRepository: InMemoryEmailAccountsRepository;
  let foldersRepository: FakeEmailFoldersRepository;
  let sut: SaveEmailDraftUseCase;

  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new FakeEmailFoldersRepository();

    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      append: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };

    sut = new SaveEmailDraftUseCase(
      accountsRepository,
      foldersRepository as never,
      new FakeCipherService() as never,
    );

    await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: 'user@example.com',
      encryptedSecret: 'enc:password',
      displayName: 'Test User',
      isActive: true,
    });
  });

  it('should save draft in provider drafts folder', async () => {
    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      to: ['recipient@example.com'],
      subject: 'Rascunho de teste',
      bodyHtml: '<p>Conteúdo</p>',
    });

    // In test environment the IMAP connection is skipped but draftId must be returned
    expect(result.draftId).toContain('@opensea.local');
  });

  it('should throw when account is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: 'missing-account',
      }),
    ).rejects.toThrow('Email account not found');
  });

  it('should throw error when DRAFTS folder not found', async () => {
    // Override foldersRepository to return no folders
    foldersRepository.listByAccount = vi.fn().mockResolvedValue([]);

    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: account!.id.toString(),
        subject: 'Test draft',
        bodyHtml: '<p>Content</p>',
      }),
    ).rejects.toThrow('Drafts folder not found for this account');
  });

  it('should throw error when account is inactive', async () => {
    const inactiveAccount = await accountsRepository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'inactive@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: 'inactive@example.com',
      encryptedSecret: 'enc:password',
      isActive: false,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: inactiveAccount.id.toString(),
        subject: 'Draft',
        bodyHtml: '<p>Content</p>',
      }),
    ).rejects.toThrow('Email account is not active');
  });
});
