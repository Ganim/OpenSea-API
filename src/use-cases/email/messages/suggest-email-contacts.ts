import type {
  EmailAccountsRepository,
  EmailMessagesRepository,
} from '@/repositories/email';

interface SuggestEmailContactsRequest {
  tenantId: string;
  userId: string;
  query: string;
  limit?: number;
}

interface EmailContactSuggestion {
  email: string;
  name: string | null;
  frequency: number;
}

interface SuggestEmailContactsResponse {
  contacts: EmailContactSuggestion[];
}

export class SuggestEmailContactsUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailMessagesRepository: EmailMessagesRepository,
  ) {}

  async execute(
    request: SuggestEmailContactsRequest,
  ): Promise<SuggestEmailContactsResponse> {
    const { tenantId, userId, query } = request;
    const limit = Math.min(request.limit ?? 10, 50);

    // Get all accounts the user has access to (owned + shared with canRead)
    const visibleAccounts =
      await this.emailAccountsRepository.listVisibleByUser(tenantId, userId);

    if (visibleAccounts.length === 0) {
      return { contacts: [] };
    }

    const accountIds = visibleAccounts.map((a) => a.id.toString());

    const contacts = await this.emailMessagesRepository.suggestContacts(
      accountIds,
      query,
      limit,
    );

    return { contacts };
  }
}
