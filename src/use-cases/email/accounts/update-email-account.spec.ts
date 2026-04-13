import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateEmailAccountUseCase } from './update-email-account';

// Mock SSRF validation — unit tests use fake hosts like imap.example.com
vi.mock('@/utils/security/validate-email-host', () => ({
  isEmailHostSafe: vi.fn().mockResolvedValue(true),
}));

class FakeCipherService {
  encrypt(value: string) {
    return `enc:${value}`;
  }
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

class FakeImapService {
  testConnection = vi.fn().mockResolvedValue(undefined);
}

class FakeSmtpService {
  testConnection = vi.fn().mockResolvedValue(undefined);
}

let repository: InMemoryEmailAccountsRepository;
let sut: UpdateEmailAccountUseCase;

describe('UpdateEmailAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryEmailAccountsRepository();
    sut = new UpdateEmailAccountUseCase(
      repository,

      new FakeCipherService() as any,

      new FakeImapService() as any,

      new FakeSmtpService() as any,
    );
  });

  it('should allow manager to update account', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'owner@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'owner@example.com',
      encryptedSecret: 'enc:secret',
    });

    await repository.upsertAccess({
      accountId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
      canManage: true,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-2',
      accountId: created.id.toString(),
      displayName: 'Support',
    });

    expect(result.account.displayName).toBe('Support');
  });

  it('should reject non-owner default change', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'owner@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'owner@example.com',
      encryptedSecret: 'enc:secret',
    });

    await repository.upsertAccess({
      accountId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
      canManage: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        accountId: created.id.toString(),
        isDefault: true,
      }),
    ).rejects.toThrow('default');
  });
});
