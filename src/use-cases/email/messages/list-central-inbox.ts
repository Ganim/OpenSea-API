import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import {
  emailMessageToListDTO,
  type EmailMessageListItemDTO,
} from '@/mappers/email';
import type {
  EmailAccountsRepository,
  EmailMessagesRepository,
} from '@/repositories/email';

interface ListCentralInboxRequest {
  tenantId: string;
  userId: string;
  accountIds: string[];
  unread?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  cursor?: string;
}

interface ListCentralInboxResponse {
  messages: EmailMessageListItemDTO[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  nextCursor?: string | null;
}

export class ListCentralInboxUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailMessagesRepository: EmailMessagesRepository,
  ) {}

  async execute(
    request: ListCentralInboxRequest,
  ): Promise<ListCentralInboxResponse> {
    const { tenantId, userId } = request;
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 50, 100);

    // Filter to only accounts the user has access to
    const accessibleAccountIds: string[] = [];

    for (const accountId of request.accountIds) {
      const account = await this.emailAccountsRepository.findById(
        accountId,
        tenantId,
      );
      if (!account) continue;

      const isOwner = account.ownerUserId.toString() === userId;
      if (isOwner) {
        accessibleAccountIds.push(accountId);
        continue;
      }

      const access = await this.emailAccountsRepository.findAccess(
        accountId,
        userId,
      );
      if (access?.canRead) {
        accessibleAccountIds.push(accountId);
      }
    }

    if (accessibleAccountIds.length === 0) {
      throw new ForbiddenError('No accessible email accounts');
    }

    const result = await this.emailMessagesRepository.listCentralInbox({
      tenantId,
      accountIds: accessibleAccountIds,
      unread: request.unread,
      search: request.search,
      page,
      limit,
      cursor: request.cursor,
    });

    const pages = Math.ceil(result.total / limit);

    return {
      messages: result.messages.map(emailMessageToListDTO),
      total: result.total,
      page,
      limit,
      pages,
      nextCursor: result.nextCursor,
    };
  }
}
