import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingAccount } from '@/entities/messaging/messaging-account';
import { MessagingContact } from '@/entities/messaging/messaging-contact';
import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { InMemoryMessagingMessagesRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-messages-repository';
import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageResult,
} from '@/services/messaging/messaging-gateway.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SendMessageUseCase } from './send-message';

const TENANT_ID = 'tenant-1';
const ACCOUNT_ID = 'account-1';
const CONTACT_ID = 'contact-1';

class FakeMessagingGateway implements MessagingGateway {
  readonly channel = 'WHATSAPP';
  sendMessage = vi.fn().mockResolvedValue({
    externalId: 'ext-msg-123',
    status: 'sent',
  } satisfies SendMessageResult);

  parseWebhook = vi.fn().mockResolvedValue([] satisfies ParsedWebhookEvent[]);

  verifyWebhook = vi.fn().mockReturnValue(true);
}

let messagingAccountsRepository: InMemoryMessagingAccountsRepository;
let messagingContactsRepository: InMemoryMessagingContactsRepository;
let messagingMessagesRepository: InMemoryMessagingMessagesRepository;
let fakeGateway: FakeMessagingGateway;
let sut: SendMessageUseCase;

describe('SendMessageUseCase', () => {
  beforeEach(async () => {
    messagingAccountsRepository = new InMemoryMessagingAccountsRepository();
    messagingContactsRepository = new InMemoryMessagingContactsRepository();
    messagingMessagesRepository = new InMemoryMessagingMessagesRepository();
    fakeGateway = new FakeMessagingGateway();

    sut = new SendMessageUseCase(
      messagingAccountsRepository,
      messagingContactsRepository,
      messagingMessagesRepository,
      fakeGateway,
    );

    // Seed account and contact
    await messagingAccountsRepository.create(
      MessagingAccount.create(
        {
          tenantId: new UniqueEntityID(TENANT_ID),
          channel: 'WHATSAPP',
          name: 'Main WhatsApp',
        },
        new UniqueEntityID(ACCOUNT_ID),
      ),
    );

    await messagingContactsRepository.create(
      MessagingContact.create(
        {
          tenantId: new UniqueEntityID(TENANT_ID),
          accountId: new UniqueEntityID(ACCOUNT_ID),
          channel: 'WHATSAPP',
          externalId: '+5511999998888',
        },
        new UniqueEntityID(CONTACT_ID),
      ),
    );
  });

  it('should send a text message successfully', async () => {
    const { message } = await sut.execute({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      contactId: CONTACT_ID,
      text: 'Hello, world!',
    });

    expect(message.direction).toBe('OUTBOUND');
    expect(message.type).toBe('TEXT');
    expect(message.status).toBe('SENT');
    expect(message.externalId).toBe('ext-msg-123');
    expect(message.sentAt).toBeDefined();
    expect(fakeGateway.sendMessage).toHaveBeenCalledOnce();
  });

  it('should mark message as FAILED when gateway throws', async () => {
    fakeGateway.sendMessage.mockRejectedValueOnce(new Error('Gateway timeout'));

    const { message } = await sut.execute({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      contactId: CONTACT_ID,
      text: 'This will fail',
    });

    expect(message.status).toBe('FAILED');
    expect(message.errorMessage).toBe('Gateway timeout');
    expect(messagingMessagesRepository.items).toHaveLength(1);
  });

  it('should throw when account does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        accountId: 'non-existent',
        contactId: CONTACT_ID,
        text: 'Hello',
      }),
    ).rejects.toThrow('Messaging account not found');
  });

  it('should throw when account belongs to another tenant', async () => {
    await expect(
      sut.execute({
        tenantId: 'other-tenant',
        accountId: ACCOUNT_ID,
        contactId: CONTACT_ID,
        text: 'Hello',
      }),
    ).rejects.toThrow('Messaging account not found');
  });

  it('should throw when account is not active', async () => {
    const inactiveAccount = MessagingAccount.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        channel: 'WHATSAPP',
        name: 'Inactive Account',
        status: 'INACTIVE',
      },
      new UniqueEntityID('inactive-account'),
    );
    await messagingAccountsRepository.create(inactiveAccount);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        accountId: 'inactive-account',
        contactId: CONTACT_ID,
        text: 'Hello',
      }),
    ).rejects.toThrow('Messaging account is not active');
  });

  it('should throw when contact does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        accountId: ACCOUNT_ID,
        contactId: 'non-existent',
        text: 'Hello',
      }),
    ).rejects.toThrow('Messaging contact not found');
  });

  it('should resolve message type as TEMPLATE when templateName is provided', async () => {
    const { message } = await sut.execute({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      contactId: CONTACT_ID,
      templateName: 'welcome_template',
      templateParams: { name: 'John' },
    });

    expect(message.type).toBe('TEMPLATE');
  });

  it('should resolve message type as IMAGE for image media', async () => {
    const { message } = await sut.execute({
      tenantId: TENANT_ID,
      accountId: ACCOUNT_ID,
      contactId: CONTACT_ID,
      mediaUrl: 'https://example.com/photo.jpg',
      mediaType: 'image/jpeg',
    });

    expect(message.type).toBe('IMAGE');
  });
});
