import { emailAccountToDTO, type EmailAccountDTO } from '@/mappers/email';
import type { EmailAccountsRepository } from '@/repositories/email';

interface ListEmailAccountsRequest {
  tenantId: string;
  userId: string;
}

interface ListEmailAccountsResponse {
  accounts: EmailAccountDTO[];
}

export class ListEmailAccountsUseCase {
  constructor(private emailAccountsRepository: EmailAccountsRepository) {}

  async execute(
    request: ListEmailAccountsRequest,
  ): Promise<ListEmailAccountsResponse> {
    const accounts = await this.emailAccountsRepository.listVisibleByUser(
      request.tenantId,
      request.userId,
    );

    return {
      accounts: accounts.map(emailAccountToDTO),
    };
  }
}
