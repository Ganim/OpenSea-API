import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
  EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { createImapClient } from '@/services/email/imap-client.service';

interface ToggleEmailMessageFlagRequest {
  tenantId: string;
  userId: string;
  messageId: string;
  isFlagged: boolean;
}

export class ToggleEmailMessageFlagUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(request: ToggleEmailMessageFlagRequest): Promise<void> {
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

      if (!access || !access.canRead) {
        throw new ForbiddenError('You do not have access to this message');
      }
    }

    const folder = await this.emailFoldersRepository.findById(
      message.folderId.toString(),
      account.id.toString(),
    );

    if (!folder) {
      throw new ResourceNotFoundError('Email folder not found');
    }

    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const client = createImapClient({
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      rejectUnauthorized: account.tlsVerify,
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(folder.remoteName);
      try {
        if (request.isFlagged) {
          await client.messageFlagsAdd(message.remoteUid, ['\\Flagged'], {
            uid: true,
          });
        } else {
          await client.messageFlagsRemove(message.remoteUid, ['\\Flagged'], {
            uid: true,
          });
        }
      } finally {
        lock.release();
      }

      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId: request.tenantId,
        isFlagged: request.isFlagged,
      });
    } catch (_error) {
      throw new BadRequestError('Failed to update email message flag');
    } finally {
      await client.logout().catch(() => undefined);
    }
  }
}
