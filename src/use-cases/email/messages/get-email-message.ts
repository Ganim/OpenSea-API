import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { emailMessageToDTO, type EmailMessageDTO } from '@/mappers/email';
import type {
    EmailAccountsRepository,
    EmailMessagesRepository,
} from '@/repositories/email';

interface GetEmailMessageRequest {
  tenantId: string;
  userId: string;
  messageId: string;
}

interface GetEmailMessageResponse {
  message: EmailMessageDTO;
}

export class GetEmailMessageUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailMessagesRepository: EmailMessagesRepository,
  ) {}

  async execute(
    request: GetEmailMessageRequest,
  ): Promise<GetEmailMessageResponse> {
    const { tenantId, userId, messageId } = request;

    const message = await this.emailMessagesRepository.findById(
      messageId,
      tenantId,
    );

    if (!message) {
      throw new ResourceNotFoundError('Email message not found');
    }

    const account = await this.emailAccountsRepository.findById(
      message.accountId.toString(),
      tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        account.id.toString(),
        userId,
      );

      if (!access || !access.canRead) {
        throw new ForbiddenError('You do not have access to this message');
      }
    }

    const attachments = await this.emailMessagesRepository.listAttachments(
      message.id.toString(),
    );

    return {
      message: emailMessageToDTO(message, attachments),
    };
  }
}
