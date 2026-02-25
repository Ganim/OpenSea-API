import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { EmailAccountsRepository } from '@/repositories/email/email-accounts-repository';
import type { EmailMessagesRepository } from '@/repositories/email/email-messages-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface GetEmailAttachmentDownloadUrlRequest {
  tenantId: string;
  userId: string;
  messageId: string;
  attachmentId: string;
}

interface GetEmailAttachmentDownloadUrlResponse {
  url: string;
  filename: string;
  contentType: string;
}

export class GetEmailAttachmentDownloadUrlUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: GetEmailAttachmentDownloadUrlRequest,
  ): Promise<GetEmailAttachmentDownloadUrlResponse> {
    const { tenantId, userId, messageId, attachmentId } = request;

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

    const canRead =
      account.ownerUserId.toString() === userId ||
      !!(await this.emailAccountsRepository.findAccess(
        account.id.toString(),
        userId,
      ));

    if (!canRead) {
      throw new ForbiddenError('You do not have access to this email account');
    }

    const attachment =
      await this.emailMessagesRepository.findAttachmentById(attachmentId);

    if (!attachment || attachment.messageId.toString() !== messageId) {
      throw new ResourceNotFoundError('Attachment not found');
    }

    const url = await this.fileUploadService.getPresignedUrl(
      attachment.storageKey,
      3600,
    );

    return {
      url,
      filename: attachment.filename,
      contentType: attachment.contentType,
    };
  }
}
