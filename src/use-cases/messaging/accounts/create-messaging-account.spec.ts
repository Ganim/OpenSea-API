import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessagingAccountUseCase } from './create-messaging-account';

let messagingAccountsRepository: InMemoryMessagingAccountsRepository;
let sut: CreateMessagingAccountUseCase;

describe('CreateMessagingAccountUseCase', () => {
  beforeEach(() => {
    messagingAccountsRepository = new InMemoryMessagingAccountsRepository();
    sut = new CreateMessagingAccountUseCase(messagingAccountsRepository);
  });

  it('should create a WhatsApp messaging account', async () => {
    const { messagingAccount } = await sut.execute({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      name: 'Main WhatsApp',
      phoneNumber: '+5511999998888',
      wabaId: 'waba-123',
    });

    expect(messagingAccount.id).toBeDefined();
    expect(messagingAccount.channel).toBe('WHATSAPP');
    expect(messagingAccount.name).toBe('Main WhatsApp');
    expect(messagingAccount.phoneNumber).toBe('+5511999998888');
    expect(messagingAccount.status).toBe('ACTIVE');
    expect(messagingAccountsRepository.items).toHaveLength(1);
  });

  it('should create an Instagram messaging account', async () => {
    const { messagingAccount } = await sut.execute({
      tenantId: 'tenant-1',
      channel: 'INSTAGRAM',
      name: 'Company Instagram',
      igAccountId: 'ig-456',
      accessToken: 'meta-token-abc',
    });

    expect(messagingAccount.channel).toBe('INSTAGRAM');
    expect(messagingAccount.igAccountId).toBe('ig-456');
    expect(messagingAccount.accessToken).toBe('meta-token-abc');
  });

  it('should create a Telegram messaging account', async () => {
    const { messagingAccount } = await sut.execute({
      tenantId: 'tenant-1',
      channel: 'TELEGRAM',
      name: 'Support Bot',
      tgBotToken: 'bot-token-123',
      tgBotUsername: 'support_bot',
    });

    expect(messagingAccount.channel).toBe('TELEGRAM');
    expect(messagingAccount.tgBotToken).toBe('bot-token-123');
    expect(messagingAccount.tgBotUsername).toBe('support_bot');
  });

  it('should not allow duplicate account names for the same channel', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      name: 'Main WhatsApp',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        channel: 'WHATSAPP',
        name: 'Main WhatsApp',
      }),
    ).rejects.toThrow(
      'A messaging account with name "Main WhatsApp" already exists for channel WHATSAPP',
    );
  });

  it('should allow same name on different channels', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      name: 'Main Account',
    });

    const { messagingAccount } = await sut.execute({
      tenantId: 'tenant-1',
      channel: 'TELEGRAM',
      name: 'Main Account',
    });

    expect(messagingAccount.channel).toBe('TELEGRAM');
    expect(messagingAccountsRepository.items).toHaveLength(2);
  });

  it('should set default values for optional fields', async () => {
    const { messagingAccount } = await sut.execute({
      tenantId: 'tenant-1',
      channel: 'WHATSAPP',
      name: 'Minimal Account',
    });

    expect(messagingAccount.status).toBe('ACTIVE');
    expect(messagingAccount.phoneNumber).toBeNull();
    expect(messagingAccount.webhookUrl).toBeNull();
    expect(messagingAccount.settings).toBeNull();
  });
});
