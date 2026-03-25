import type { MessagingAccount } from '@/entities/messaging/messaging-account';
import type { MessagingAccountsRepository } from '@/repositories/messaging/messaging-accounts-repository';

interface ListMessagingAccountsRequest {
  tenantId: string;
}

interface ListMessagingAccountsResponse {
  messagingAccounts: MessagingAccount[];
}

export class ListMessagingAccountsUseCase {
  constructor(
    private messagingAccountsRepository: MessagingAccountsRepository,
  ) {}

  async execute(
    request: ListMessagingAccountsRequest,
  ): Promise<ListMessagingAccountsResponse> {
    const messagingAccounts =
      await this.messagingAccountsRepository.findByTenantId(request.tenantId);

    return { messagingAccounts };
  }
}
