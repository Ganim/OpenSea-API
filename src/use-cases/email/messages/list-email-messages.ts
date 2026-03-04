import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  emailMessageToListDTO,
  type EmailMessageListItemDTO,
} from '@/mappers/email';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
  EmailMessagesRepository,
} from '@/repositories/email';

interface ListEmailMessagesRequest {
  tenantId: string;
  userId: string;
  accountId: string;
  folderId?: string;
  unread?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface ListEmailMessagesResponse {
  messages: EmailMessageListItemDTO[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export class ListEmailMessagesUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private emailMessagesRepository: EmailMessagesRepository,
  ) {}

  async execute(
    request: ListEmailMessagesRequest,
  ): Promise<ListEmailMessagesResponse> {
    const { tenantId, userId, accountId, folderId } = request;
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const account = await this.emailAccountsRepository.findById(
      accountId,
      tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        accountId,
        userId,
      );

      if (!access || !access.canRead) {
        throw new ForbiddenError('You do not have access to this account');
      }
    }

    if (folderId) {
      const folder = await this.emailFoldersRepository.findById(
        folderId,
        accountId,
      );

      if (!folder) {
        throw new ResourceNotFoundError('Email folder not found');
      }
    }

    const result = await this.emailMessagesRepository.list({
      tenantId,
      accountId,
      folderId,
      unread: request.unread,
      search: request.search,
      page,
      limit,
    });

    const pages = Math.ceil(result.total / limit);

    return {
      messages: result.messages.map(emailMessageToListDTO),
      total: result.total,
      page,
      limit,
      pages,
    };
  }
}
