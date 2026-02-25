import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailAccountsRepository } from '@/repositories/email';

interface DeleteEmailAccountRequest {
  tenantId: string;
  userId: string;
  accountId: string;
}

export class DeleteEmailAccountUseCase {
  constructor(private emailAccountsRepository: EmailAccountsRepository) {}

  async execute(request: DeleteEmailAccountRequest): Promise<void> {
    const account = await this.emailAccountsRepository.findById(
      request.accountId,
      request.tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === request.userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        request.accountId,
        request.userId,
      );

      if (!access || !access.canManage) {
        throw new ForbiddenError(
          'You do not have access to delete this account',
        );
      }
    }

    await this.emailAccountsRepository.delete(
      request.accountId,
      request.tenantId,
    );
  }
}
