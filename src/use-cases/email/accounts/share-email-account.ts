import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  EmailAccountAccessItem,
  EmailAccountsRepository,
} from '@/repositories/email';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface ShareEmailAccountRequest {
  tenantId: string;
  userId: string;
  accountId: string;
  targetUserId: string;
  canRead?: boolean;
  canSend?: boolean;
  canManage?: boolean;
}

interface ShareEmailAccountResponse {
  access: EmailAccountAccessItem;
}

export class ShareEmailAccountUseCase {
  constructor(private emailAccountsRepository: EmailAccountsRepository) {}

  async execute(
    request: ShareEmailAccountRequest,
  ): Promise<ShareEmailAccountResponse> {
    const account = await this.emailAccountsRepository.findById(
      request.accountId,
      request.tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    if (account.ownerUserId.toString() === request.targetUserId) {
      throw new BadRequestError('Cannot share account with the owner');
    }

    const isOwner = account.ownerUserId.toString() === request.userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        request.accountId,
        request.userId,
      );

      if (!access || !access.canManage) {
        throw new ForbiddenError(
          'You do not have access to share this account',
        );
      }
    }

    const canSend = request.canSend ?? false;
    const canManage = request.canManage ?? false;
    const canRead = (request.canRead ?? true) || canSend || canManage;

    const access = await this.emailAccountsRepository.upsertAccess({
      accountId: request.accountId,
      tenantId: request.tenantId,
      userId: request.targetUserId,
      canRead,
      canSend,
      canManage,
    });

    queueAuditLog({
      userId: request.userId,
      action: 'EMAIL_SHARE',
      entity: 'EMAIL_ACCOUNT_ACCESS',
      entityId: access.id,
      module: 'EMAIL',
      description: `Shared email account ${account.address} with user ${request.targetUserId}`,
      newData: { targetUserId: request.targetUserId, canRead, canSend, canManage },
    }).catch(() => {});

    return { access };
  }
}
