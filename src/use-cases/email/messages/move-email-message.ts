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

interface MoveEmailMessageRequest {
  tenantId: string;
  userId: string;
  messageId: string;
  targetFolderId: string;
}

export class MoveEmailMessageUseCase {
  constructor(
    private emailAccountsRepository: EmailAccountsRepository,
    private emailFoldersRepository: EmailFoldersRepository,
    private emailMessagesRepository: EmailMessagesRepository,
    private credentialCipherService: CredentialCipherService,
  ) {}

  async execute(request: MoveEmailMessageRequest): Promise<void> {
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
        throw new ForbiddenError('You do not have access to move messages');
      }
    }

    const sourceFolder = await this.emailFoldersRepository.findById(
      message.folderId.toString(),
      account.id.toString(),
    );

    if (!sourceFolder) {
      throw new ResourceNotFoundError('Email folder not found');
    }

    const targetFolder = await this.emailFoldersRepository.findById(
      request.targetFolderId,
      account.id.toString(),
    );

    if (!targetFolder) {
      throw new ResourceNotFoundError('Target email folder not found');
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
    });

    try {
      await client.connect();
      const lock = await client.getMailboxLock(sourceFolder.remoteName);
      try {
        await client.messageMove(message.remoteUid, targetFolder.remoteName, {
          uid: true,
        });
      } finally {
        lock.release();
      }

      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId: request.tenantId,
        folderId: targetFolder.id.toString(),
      });
    } catch (_error) {
      throw new BadRequestError('Failed to move email message');
    } finally {
      await client.logout().catch(() => undefined);
    }
  }
}
