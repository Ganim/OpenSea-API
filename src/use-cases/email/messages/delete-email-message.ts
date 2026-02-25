import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
    EmailAccountsRepository,
    EmailFoldersRepository,
    EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { ImapFlow } from 'imapflow';

interface DeleteEmailMessageRequest {
  tenantId: string;
  userId: string;
  messageId: string;
}

export class DeleteEmailMessageUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(request: DeleteEmailMessageRequest): Promise<void> {
    const message = await this.emailMessagesRepository.findById(
      request.messageId,
      request.tenantId,
    );

    if (!message) {
      throw new ResourceNotFoundError('Email message not found');
    }

    const account = await this.emailAccountsRepository.findById(
      message.accountId.toString(),
      request.tenantId,
    );

    if (!account) {
      throw new ResourceNotFoundError('Email account not found');
    }

    const isOwner = account.ownerUserId.toString() === request.userId;

    if (!isOwner) {
      const access = await this.emailAccountsRepository.findAccess(
        account.id.toString(),
        request.userId,
      );

      if (!access || !access.canManage) {
        throw new ForbiddenError('You do not have access to delete messages');
      }
    }

    const folder = await this.emailFoldersRepository.findById(
      message.folderId.toString(),
      account.id.toString(),
    );

    if (!folder) {
      throw new ResourceNotFoundError('Email folder not found');
    }

    // In test environment, skip IMAP connection
    if (process.env.NODE_ENV === 'test') {
      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId: request.tenantId,
        deletedAt: new Date(),
      });
      return;
    }

    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const client = new ImapFlow({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      auth: {
        user: account.username,
        pass: secret,
      },
      logger: false,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(folder.remoteName);
      try {
        await client.messageFlagsAdd(message.remoteUid, ['\\Deleted'], {
          uid: true,
        });
        await client.expunge();
      } finally {
        lock.release();
      }

      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId: request.tenantId,
        deletedAt: new Date(),
      });
    } catch (error) {
      throw new BadRequestError('Failed to delete email message');
    } finally {
      await client.logout().catch(() => undefined);
    }
  }
}
