import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { emailFolderToDTO, type EmailFolderDTO } from '@/mappers/email';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
} from '@/repositories/email';

interface ListEmailFoldersRequest {
  tenantId: string;
  userId: string;
  accountId: string;
}

interface ListEmailFoldersResponse {
  folders: EmailFolderDTO[];
}

export class ListEmailFoldersUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
  ) {}

  async execute(
    request: ListEmailFoldersRequest,
  ): Promise<ListEmailFoldersResponse> {
    const { tenantId, userId, accountId } = request;

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

    const [folders, messageCounts] = await Promise.all([
      this.emailFoldersRepository.listByAccount(accountId),
      this.emailFoldersRepository.getMessageCounts(accountId),
    ]);

    const countsMap = new Map(messageCounts.map((c) => [c.folderId, c]));

    return {
      folders: folders.map((folder) =>
        emailFolderToDTO(folder, countsMap.get(folder.id.toString())),
      ),
    };
  }
}
