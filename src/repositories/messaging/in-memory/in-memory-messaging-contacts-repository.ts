import type { MessagingContact } from '@/entities/messaging/messaging-contact';
import type {
  ListContactsParams,
  ListContactsResult,
  MessagingContactsRepository,
} from '../messaging-contacts-repository';

export class InMemoryMessagingContactsRepository
  implements MessagingContactsRepository
{
  public items: MessagingContact[] = [];

  async findById(id: string): Promise<MessagingContact | null> {
    return this.items.find((contact) => contact.id.toString() === id) ?? null;
  }

  async findByAccountAndExternalId(
    accountId: string,
    externalId: string,
  ): Promise<MessagingContact | null> {
    return (
      this.items.find(
        (contact) =>
          contact.accountId.toString() === accountId &&
          contact.externalId === externalId,
      ) ?? null
    );
  }

  async findByTenantId(
    tenantId: string,
    params: ListContactsParams,
  ): Promise<ListContactsResult> {
    let filteredContacts = this.items.filter(
      (contact) => contact.tenantId.toString() === tenantId,
    );

    if (params.channel) {
      filteredContacts = filteredContacts.filter(
        (contact) => contact.channel === params.channel,
      );
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredContacts = filteredContacts.filter(
        (contact) =>
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.username?.toLowerCase().includes(searchLower) ||
          contact.externalId.toLowerCase().includes(searchLower),
      );
    }

    // Sort by lastMessageAt descending (most recent first)
    filteredContacts.sort((contactA, contactB) => {
      const dateA = contactA.lastMessageAt?.getTime() ?? 0;
      const dateB = contactB.lastMessageAt?.getTime() ?? 0;
      return dateB - dateA;
    });

    const total = filteredContacts.length;
    const offset = (params.page - 1) * params.limit;
    const paginatedContacts = filteredContacts.slice(
      offset,
      offset + params.limit,
    );

    return { contacts: paginatedContacts, total };
  }

  async create(contact: MessagingContact): Promise<void> {
    this.items.push(contact);
  }

  async save(contact: MessagingContact): Promise<void> {
    const contactIndex = this.items.findIndex((existingContact) =>
      existingContact.id.equals(contact.id),
    );

    if (contactIndex >= 0) {
      this.items[contactIndex] = contact;
    }
  }
}
