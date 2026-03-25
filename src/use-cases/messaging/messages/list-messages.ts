import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { MessagingMessage } from '@/entities/messaging/messaging-message';
import type { MessagingContactsRepository } from '@/repositories/messaging/messaging-contacts-repository';
import type { MessagingMessagesRepository } from '@/repositories/messaging/messaging-messages-repository';

interface ListMessagesRequest {
  tenantId: string;
  contactId: string;
  page: number;
  limit: number;
}

interface ListMessagesResponse {
  messages: MessagingMessage[];
  total: number;
}

export class ListMessagesUseCase {
  constructor(
    private messagingContactsRepository: MessagingContactsRepository,
    private messagingMessagesRepository: MessagingMessagesRepository,
  ) {}

  async execute(request: ListMessagesRequest): Promise<ListMessagesResponse> {
    const contact = await this.messagingContactsRepository.findById(
      request.contactId,
    );

    if (!contact) {
      throw new ResourceNotFoundError('Messaging contact not found');
    }

    if (contact.tenantId.toString() !== request.tenantId) {
      throw new ResourceNotFoundError('Messaging contact not found');
    }

    const { messages, total } =
      await this.messagingMessagesRepository.findByContactId(
        request.contactId,
        {
          page: request.page,
          limit: request.limit,
        },
      );

    return { messages, total };
  }
}
