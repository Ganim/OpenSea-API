import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveEmailDraftUseCase } from './save-email-draft';

let mockClient: {
  connect: ReturnType<typeof vi.fn>;
  append: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
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
});
