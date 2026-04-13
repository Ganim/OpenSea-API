import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestEmailConnectionUseCase } from './test-email-connection';

class FakeCipherService {
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
let imapService: FakeImapService;
let smtpService: FakeSmtpService;
let sut: TestEmailConnectionUseCase;

describe('TestEmailConnectionUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryEmailAccountsRepository();
    imapService = new FakeImapService();
    smtpService = new FakeSmtpService();

    sut = new TestEmailConnectionUseCase(
      repository,

      new FakeCipherService() as any,

      imapService as any,

      smtpService as any,
    );
  });

  it('should test connection successfully for account owner', async () => {
    const account = await repository.create({
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
      isActive: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: account.id.toString(),
      }),
    ).resolves.not.toThrow();

    expect(imapService.testConnection).toHaveBeenCalledOnce();
    expect(imapService.testConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'imap.example.com',
        port: 993,
        secure: true,
        username: 'user@example.com',
        secret: 'password',
      }),
    );
    expect(smtpService.testConnection).toHaveBeenCalledOnce();
    expect(smtpService.testConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: true,
        username: 'user@example.com',
        secret: 'password',
      }),
    );
  });

  it('should test connection for user with manage permission', async () => {
    const account = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      encryptedSecret: 'enc:password',
      isActive: true,
    });

    await repository.upsertAccess({
      accountId: account.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
      canRead: true,
      canSend: false,
      canManage: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        accountId: account.id.toString(),
      }),
    ).resolves.not.toThrow();

    expect(imapService.testConnection).toHaveBeenCalledOnce();
    expect(smtpService.testConnection).toHaveBeenCalledOnce();
  });

  it('should throw ForbiddenError when user has no manage permission', async () => {
    const account = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      encryptedSecret: 'enc:password',
      isActive: true,
    });

    await repository.upsertAccess({
      accountId: account.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
      canRead: true,
      canSend: true,
      canManage: false,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        accountId: account.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ForbiddenError when user has no access at all', async () => {
    const account = await repository.create({
      tenantId: 'tenant-1',
      ownerUserId: 'user-1',
      address: 'user@example.com',
      imapHost: 'imap.example.com',
      imapPort: 993,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      username: 'user@example.com',
      encryptedSecret: 'enc:password',
      isActive: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-2',
        accountId: account.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError when account does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
