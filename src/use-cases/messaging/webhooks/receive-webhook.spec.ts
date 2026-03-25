import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingAccount } from '@/entities/messaging/messaging-account';
import { MessagingMessage } from '@/entities/messaging/messaging-message';
import { InMemoryMessagingAccountsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-accounts-repository';
import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { InMemoryMessagingMessagesRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-messages-repository';
import type {
  MessagingGateway,
  ParsedWebhookEvent,
  SendMessageResult,
} from '@/services/messaging/messaging-gateway.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReceiveWebhookUseCase } from './receive-webhook';

const TENANT_ID = 'tenant-1';
const ACCOUNT_ID = 'account-1';

class FakeMessagingGateway implements MessagingGateway {
  readonly channel = 'WHATSAPP';
  sendMessage = vi.fn().mockResolvedValue({
    externalId: 'ext-123',
    status: 'sent',
  } satisfies SendMessageResult);

  parseWebhookResult: ParsedWebhookEvent[] = [];
  parseWebhook = vi
    .fn()
    .mockImplementation(async () => this.parseWebhookResult);
  verifyWebhook = vi.fn().mockReturnValue(true);
}

let messagingAccountsRepository: InMemoryMessagingAccountsRepository;
let messagingContactsRepository: InMemoryMessagingContactsRepository;
let messagingMessagesRepository: InMemoryMessagingMessagesRepository;
let fakeGateway: FakeMessagingGateway;
let sut: ReceiveWebhookUseCase;

describe('ReceiveWebhookUseCase', () => {
  beforeEach(async () => {
    messagingAccountsRepository = new InMemoryMessagingAccountsRepository();
    messagingContactsRepository = new InMemoryMessagingContactsRepository();
    messagingMessagesRepository = new InMemoryMessagingMessagesRepository();
    fakeGateway = new FakeMessagingGateway();

    sut = new ReceiveWebhookUseCase(
      messagingAccountsRepository,
      messagingContactsRepository,
      messagingMessagesRepository,
      fakeGateway,
    );

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
  });

  it('should process an inbound message and create contact', async () => {
    fakeGateway.parseWebhookResult = [
      {
        type: 'message',
        contactExternalId: '+5511888887777',
        contactName: 'New Customer',
        messageExternalId: 'wa-msg-1',
        text: 'Hello, I need help',
        timestamp: new Date('2026-03-25T10:00:00Z'),
      },
    ];

    const { processedEventCount } = await sut.execute({
      channel: 'WHATSAPP',
      accountId: ACCOUNT_ID,
      rawPayload: {},
      signature: 'valid-sig',
    });

    expect(processedEventCount).toBe(1);
    expect(messagingContactsRepository.items).toHaveLength(1);
    expect(messagingContactsRepository.items[0].name).toBe('New Customer');
    expect(messagingContactsRepository.items[0].unreadCount).toBe(1);
    expect(messagingMessagesRepository.items).toHaveLength(1);
    expect(messagingMessagesRepository.items[0].direction).toBe('INBOUND');
    expect(messagingMessagesRepository.items[0].text).toBe(
      'Hello, I need help',
    );
  });

  it('should reuse existing contact on subsequent messages', async () => {
    fakeGateway.parseWebhookResult = [
      {
        type: 'message',
        contactExternalId: '+5511888887777',
        contactName: 'Returning Customer',
        messageExternalId: 'wa-msg-1',
        text: 'First message',
      },
    ];

    await sut.execute({
      channel: 'WHATSAPP',
      accountId: ACCOUNT_ID,
      rawPayload: {},
      signature: 'valid-sig',
    });

    fakeGateway.parseWebhookResult = [
      {
        type: 'message',
        contactExternalId: '+5511888887777',
        contactName: 'Returning Customer',
        messageExternalId: 'wa-msg-2',
        text: 'Second message',
      },
    ];

    await sut.execute({
      channel: 'WHATSAPP',
      accountId: ACCOUNT_ID,
      rawPayload: {},
      signature: 'valid-sig',
    });

    expect(messagingContactsRepository.items).toHaveLength(1);
    expect(messagingContactsRepository.items[0].unreadCount).toBe(2);
    expect(messagingMessagesRepository.items).toHaveLength(2);
  });

  it('should process status update events', async () => {
    // Create an outbound message first
    const outboundMessage = MessagingMessage.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      accountId: new UniqueEntityID(ACCOUNT_ID),
      contactId: new UniqueEntityID('contact-1'),
      channel: 'WHATSAPP',
      direction: 'OUTBOUND',
      type: 'TEXT',
      status: 'SENT',
      externalId: 'wa-msg-outbound-1',
    });
    await messagingMessagesRepository.create(outboundMessage);

    fakeGateway.parseWebhookResult = [
      {
        type: 'status_update',
        contactExternalId: '+5511888887777',
        messageExternalId: 'wa-msg-outbound-1',
        status: 'DELIVERED',
        timestamp: new Date('2026-03-25T10:05:00Z'),
      },
    ];

    const { processedEventCount } = await sut.execute({
      channel: 'WHATSAPP',
      accountId: ACCOUNT_ID,
      rawPayload: {},
      signature: 'valid-sig',
    });

    expect(processedEventCount).toBe(1);
    expect(messagingMessagesRepository.items[0].status).toBe('DELIVERED');
    expect(messagingMessagesRepository.items[0].deliveredAt).toBeDefined();
  });

  it('should throw when signature is invalid', async () => {
    fakeGateway.verifyWebhook.mockReturnValueOnce(false);

    await expect(
      sut.execute({
        channel: 'WHATSAPP',
        accountId: ACCOUNT_ID,
        rawPayload: {},
        signature: 'invalid',
      }),
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('should throw when account does not exist', async () => {
    await expect(
      sut.execute({
        channel: 'WHATSAPP',
        accountId: 'non-existent',
        rawPayload: {},
        signature: 'valid-sig',
      }),
    ).rejects.toThrow('Unknown messaging account for webhook');
  });

  it('should skip duplicate messages by externalId', async () => {
    fakeGateway.parseWebhookResult = [
      {
        type: 'message',
        contactExternalId: '+5511888887777',
        contactName: 'Customer',
        messageExternalId: 'wa-msg-duplicate',
        text: 'Hello',
      },
    ];

    await sut.execute({
      channel: 'WHATSAPP',
      accountId: ACCOUNT_ID,
      rawPayload: {},
      signature: 'valid-sig',
    });

    // Send same webhook again
    await sut.execute({
      channel: 'WHATSAPP',
      accountId: ACCOUNT_ID,
      rawPayload: {},
      signature: 'valid-sig',
    });

    expect(messagingMessagesRepository.items).toHaveLength(1);
  });
});
