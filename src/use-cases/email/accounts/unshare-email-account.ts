import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailAccountsRepository } from '@/repositories/email';

interface UnshareEmailAccountRequest {
  tenantId: string;
  userId: string;
  accountId: string;
  targetUserId: string;
}

export class UnshareEmailAccountUseCase {
  constructor(private emailAccountsRepository: EmailAccountsRepository) {}

  async execute(request: UnshareEmailAccountRequest): Promise<void> {
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
          'You do not have access to unshare this account',
        );
      }
    }

    await this.emailAccountsRepository.deleteAccess(
      request.accountId,
      request.targetUserId,
      request.tenantId,
    );
  }
}
