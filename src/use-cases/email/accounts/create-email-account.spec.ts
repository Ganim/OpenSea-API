import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEmailAccountUseCase } from './create-email-account';

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
let sut: CreateEmailAccountUseCase;
let imapService: FakeImapService;
let smtpService: FakeSmtpService;

describe('CreateEmailAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryEmailAccountsRepository();
    imapService = new FakeImapService();
    smtpService = new FakeSmtpService();

    sut = new CreateEmailAccountUseCase(
      repository,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new FakeCipherService() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      imapService as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      smtpService as any,
    );
  });

  it('should create a new email account', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      secret: 'password',
      isDefault: true,
    });

    expect(result.account.address).toBe('user@example.com');
    expect(result.account.isDefault).toBe(true);
    expect(repository.items).toHaveLength(1);
    expect(imapService.testConnection).toHaveBeenCalledOnce();
    expect(smtpService.testConnection).toHaveBeenCalledOnce();
  });

  it('should reject duplicated email account address', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      secret: 'password',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        address: 'user@example.com',
        imapHost: 'imap.example.com',
        imapPort: 993,
        smtpHost: 'smtp.example.com',
        smtpPort: 587,
        username: 'user@example.com',
        secret: 'password',
      }),
    ).rejects.toThrow('Email account already exists');
  });
});
