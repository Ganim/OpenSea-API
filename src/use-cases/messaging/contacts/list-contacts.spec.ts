import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MessagingContact } from '@/entities/messaging/messaging-contact';
import { InMemoryMessagingContactsRepository } from '@/repositories/messaging/in-memory/in-memory-messaging-contacts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListContactsUseCase } from './list-contacts';

let messagingContactsRepository: InMemoryMessagingContactsRepository;
let sut: ListContactsUseCase;

const TENANT_ID = 'tenant-1';
const ACCOUNT_ID = 'account-1';

function makeContact(
  overrides: Partial<{
    name: string;
    channel: 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM';
    externalId: string;
    lastMessageAt: Date;
  }> = {},
): MessagingContact {
  return MessagingContact.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    accountId: new UniqueEntityID(ACCOUNT_ID),
    channel: overrides.channel ?? 'WHATSAPP',
    externalId:
      overrides.externalId ?? `+55119${Math.random().toString().slice(2, 10)}`,
    name: overrides.name ?? 'Test Contact',
    lastMessageAt: overrides.lastMessageAt ?? new Date(),
  });
}

describe('ListContactsUseCase', () => {
  beforeEach(() => {
    messagingContactsRepository = new InMemoryMessagingContactsRepository();
    sut = new ListContactsUseCase(messagingContactsRepository);
  });

  it('should list contacts for a tenant with pagination', async () => {
    for (let contactIndex = 0; contactIndex < 5; contactIndex++) {
      await messagingContactsRepository.create(
        makeContact({ name: `Contact ${contactIndex}` }),
      );
    }

    const { contacts, total } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 3,
    });

    expect(contacts).toHaveLength(3);
    expect(total).toBe(5);
  });

  it('should filter contacts by channel', async () => {
    await messagingContactsRepository.create(
      makeContact({ channel: 'WHATSAPP', name: 'WA Contact' }),
    );
    await messagingContactsRepository.create(
      makeContact({ channel: 'TELEGRAM', name: 'TG Contact' }),
    );

    const { contacts, total } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      channel: 'WHATSAPP',
    });

    expect(contacts).toHaveLength(1);
    expect(total).toBe(1);
    expect(contacts[0].name).toBe('WA Contact');
  });

  it('should search contacts by name', async () => {
    await messagingContactsRepository.create(
      makeContact({ name: 'Alice Wonderland' }),
    );
    await messagingContactsRepository.create(
      makeContact({ name: 'Bob Builder' }),
    );

    const { contacts, total } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      search: 'alice',
    });

    expect(contacts).toHaveLength(1);
    expect(total).toBe(1);
    expect(contacts[0].name).toBe('Alice Wonderland');
  });

  it('should return empty results for a tenant without contacts', async () => {
    const { contacts, total } = await sut.execute({
      tenantId: 'empty-tenant',
      page: 1,
      limit: 20,
    });

    expect(contacts).toHaveLength(0);
    expect(total).toBe(0);
  });
});
