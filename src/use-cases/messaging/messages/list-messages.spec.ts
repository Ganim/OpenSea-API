import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingContact } from '@/entities/messaging/messaging-contact';
import { MessagingMessage } from '@/entities/messaging/messaging-message';
import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { InMemoryMessagingMessagesRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-messages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMessagesUseCase } from './list-messages';

let messagingContactsRepository: InMemoryMessagingContactsRepository;
let messagingMessagesRepository: InMemoryMessagingMessagesRepository;
let sut: ListMessagesUseCase;

const TENANT_ID = 'tenant-1';
const ACCOUNT_ID = 'account-1';
const CONTACT_ID = 'contact-1';

describe('ListMessagesUseCase', () => {
  beforeEach(() => {
    messagingContactsRepository = new InMemoryMessagingContactsRepository();
    messagingMessagesRepository = new InMemoryMessagingMessagesRepository();
    sut = new ListMessagesUseCase(
      messagingContactsRepository,
      messagingMessagesRepository,
    );
  });

  it('should list messages for a contact with pagination', async () => {
    const contact = MessagingContact.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        accountId: new UniqueEntityID(ACCOUNT_ID),
        channel: 'WHATSAPP',
        externalId: '+5511999998888',
      },
      new UniqueEntityID(CONTACT_ID),
    );
    await messagingContactsRepository.create(contact);

    for (let messageIndex = 0; messageIndex < 5; messageIndex++) {
      await messagingMessagesRepository.create(
        MessagingMessage.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          accountId: new UniqueEntityID(ACCOUNT_ID),
          contactId: new UniqueEntityID(CONTACT_ID),
          channel: 'WHATSAPP',
          direction: 'INBOUND',
          type: 'TEXT',
          text: `Message ${messageIndex}`,
        }),
      );
    }

    const { messages, total } = await sut.execute({
      tenantId: TENANT_ID,
      contactId: CONTACT_ID,
      page: 1,
      limit: 3,
    });

    expect(messages).toHaveLength(3);
    expect(total).toBe(5);
  });

  it('should throw when contact does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        contactId: 'non-existent',
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow('Messaging contact not found');
  });

  it('should throw when contact belongs to another tenant', async () => {
    const contact = MessagingContact.create(
      {
        tenantId: new UniqueEntityID('other-tenant'),
        accountId: new UniqueEntityID(ACCOUNT_ID),
        channel: 'WHATSAPP',
        externalId: '+5511999998888',
      },
      new UniqueEntityID(CONTACT_ID),
    );
    await messagingContactsRepository.create(contact);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        contactId: CONTACT_ID,
        page: 1,
        limit: 20,
      }),
    ).rejects.toThrow('Messaging contact not found');
  });
});
