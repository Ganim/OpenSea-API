import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { emailAccountToDTO, type EmailAccountDTO } from '@/mappers/email';
import type { EmailAccountsRepository } from '@/repositories/email';

interface GetEmailAccountRequest {
  tenantId: string;
  userId: string;
  accountId: string;
}

interface GetEmailAccountResponse {
  account: EmailAccountDTO;
}

export class GetEmailAccountUseCase {
  constructor(private emailAccountsRepository: EmailAccountsRepository) {}

  async execute(
    request: GetEmailAccountRequest,
  ): Promise<GetEmailAccountResponse> {
    const account = await this.emailAccountsRepository.findById(
      request.accountId,
      request.tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    if (account.ownerUserId.toString() !== request.userId) {
      const access = await this.emailAccountsRepository.findAccess(
        request.accountId,
        request.userId,
      );

      if (!access || !access.canRead) {
        throw new ForbiddenError(
          'You do not have access to this email account',
        );
      }
    }

    return { account: emailAccountToDTO(account) };
  }
}
