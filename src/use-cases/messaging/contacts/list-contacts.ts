import type { MessagingContact } from '@/entities/messaging/messaging-contact';
import type { MessagingContactsRepository } from '@/repositories/messaging/messaging-contacts-repository';

interface ListContactsRequest {
  tenantId: string;
  page: number;
  limit: number;
  channel?: string;
  search?: string;
}

interface ListContactsResponse {
  contacts: MessagingContact[];
  total: number;
}

export class ListContactsUseCase {
  constructor(
    private messagingContactsRepository: MessagingContactsRepository,
  ) {}

  async execute(request: ListContactsRequest): Promise<ListContactsResponse> {
    const { contacts, total } =
      await this.messagingContactsRepository.findByTenantId(request.tenantId, {
        page: request.page,
        limit: request.limit,
        channel: request.channel,
        search: request.search,
      });

    return { contacts, total };
  }
}
