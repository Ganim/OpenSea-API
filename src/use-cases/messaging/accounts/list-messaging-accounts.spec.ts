import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingAccount } from '@/entities/messaging/messaging-account';
import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMessagingAccountsUseCase } from './list-messaging-accounts';

let messagingAccountsRepository: InMemoryMessagingAccountsRepository;
let sut: ListMessagingAccountsUseCase;

describe('ListMessagingAccountsUseCase', () => {
  beforeEach(() => {
    messagingAccountsRepository = new InMemoryMessagingAccountsRepository();
    sut = new ListMessagingAccountsUseCase(messagingAccountsRepository);
  });

  it('should list all messaging accounts for a tenant', async () => {
    const tenantId = 'tenant-1';

    await messagingAccountsRepository.create(
      MessagingAccount.create({
        tenantId: new UniqueEntityID(tenantId),
        channel: 'WHATSAPP',
        name: 'WhatsApp Account',
      }),
    );

    await messagingAccountsRepository.create(
      MessagingAccount.create({
        tenantId: new UniqueEntityID(tenantId),
        channel: 'TELEGRAM',
        name: 'Telegram Bot',
      }),
    );

    const { messagingAccounts } = await sut.execute({ tenantId });

    expect(messagingAccounts).toHaveLength(2);
    expect(messagingAccounts[0].channel).toBe('WHATSAPP');
    expect(messagingAccounts[1].channel).toBe('TELEGRAM');
  });

  it('should return empty array when tenant has no accounts', async () => {
    const { messagingAccounts } = await sut.execute({
      tenantId: 'tenant-without-accounts',
    });

    expect(messagingAccounts).toHaveLength(0);
  });

  it('should not return accounts from other tenants', async () => {
    await messagingAccountsRepository.create(
      MessagingAccount.create({
        tenantId: new UniqueEntityID('tenant-1'),
        channel: 'WHATSAPP',
        name: 'Tenant 1 WhatsApp',
      }),
    );

    await messagingAccountsRepository.create(
      MessagingAccount.create({
        tenantId: new UniqueEntityID('tenant-2'),
        channel: 'WHATSAPP',
        name: 'Tenant 2 WhatsApp',
      }),
    );

    const { messagingAccounts } = await sut.execute({ tenantId: 'tenant-1' });

    expect(messagingAccounts).toHaveLength(1);
    expect(messagingAccounts[0].name).toBe('Tenant 1 WhatsApp');
  });
});
