import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SendEmailMessageUseCase } from './send-email-message';

class FakeCipherService {
  decrypt(value: string) {
    return value.replace('enc:', '');
  }
}

class FakeSmtpClientService {
  send = vi.fn().mockResolvedValue('message-id-123');
}

class FakeEmailFoldersRepository {
  listByAccount = vi.fn().mockResolvedValue([]);
}

let accountsRepository: InMemoryEmailAccountsRepository;
let foldersRepository: FakeEmailFoldersRepository;
let sut: SendEmailMessageUseCase;

describe('SendEmailMessageUseCase', () => {
  beforeEach(async () => {
    accountsRepository = new InMemoryEmailAccountsRepository();
    foldersRepository = new FakeEmailFoldersRepository();

    sut = new SendEmailMessageUseCase(
      accountsRepository,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      foldersRepository as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new FakeCipherService() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new FakeSmtpClientService() as any,
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
      signature: 'Best regards',
      isActive: true,
    });
  });

  it('should send email message successfully', async () => {
    const smtpService = new FakeSmtpClientService();
    sut = new SendEmailMessageUseCase(
      accountsRepository,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      foldersRepository as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new FakeCipherService() as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      smtpService as any,
    );

    const account = await accountsRepository.findByAddress(
      'user@example.com',
      'tenant-1',
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      accountId: account!.id.toString(),
      to: ['recipient@example.com'],
      subject: 'Test Subject',
      bodyHtml: '<p>Test body</p>',
    });

    expect(result.messageId).toBe('message-id-123');
    expect(smtpService.send).toHaveBeenCalledOnce();
  });

  it('should throw error if account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        accountId: 'invalid-id',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        bodyHtml: '<p>Test body</p>',
      }),
    ).rejects.toThrow('Email account not found');
  });
});
