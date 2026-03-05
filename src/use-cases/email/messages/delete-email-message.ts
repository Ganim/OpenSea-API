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

    const currentFolder = await this.emailFoldersRepository.findById(
      message.folderId.toString(),
      account.id.toString(),
    );

    if (!currentFolder) {
      throw new ResourceNotFoundError('Email folder not found');
    }

    const trashFolder = await this.emailFoldersRepository.findByType(
      account.id.toString(),
      'TRASH',
    );

    const isAlreadyInTrash =
      trashFolder && currentFolder.id.toString() === trashFolder.id.toString();

    // If the message is NOT in the Trash folder and a Trash folder exists, move it to Trash
    if (trashFolder && !isAlreadyInTrash) {
      await this.moveMessageToTrash(
        message,
        account,
        currentFolder,
        trashFolder,
        request.tenantId,
      );
      return;
    }

    // If the message IS already in Trash (or no Trash folder exists), permanently soft-delete it
    await this.permanentlyDeleteMessage(
      message,
      account,
      currentFolder,
      request.tenantId,
    );
  }

  private async moveMessageToTrash(
    message: { id: { toString(): string }; remoteUid: number },
    account: {
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      username: string;
      encryptedSecret: string;
    },
    sourceFolder: { remoteName: string },
    trashFolder: { id: { toString(): string }; remoteName: string },
    tenantId: string,
  ): Promise<void> {
    // In test environment, skip IMAP connection
    if (process.env.NODE_ENV === 'test') {
      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId,
        folderId: trashFolder.id.toString(),
      });
      return;
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
        await client.messageMove(message.remoteUid, trashFolder.remoteName, {
          uid: true,
        });
      } finally {
        lock.release();
      }

      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId,
        folderId: trashFolder.id.toString(),
      });
    } catch (_error) {
      throw new BadRequestError('Failed to move email message to trash');
    } finally {
      await client.logout().catch(() => undefined);
    }
  }

  private async permanentlyDeleteMessage(
    message: { id: { toString(): string }; remoteUid: number },
    account: {
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      username: string;
      encryptedSecret: string;
    },
    folder: { remoteName: string },
    tenantId: string,
  ): Promise<void> {
    // In test environment, skip IMAP connection
    if (process.env.NODE_ENV === 'test') {
      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId,
        deletedAt: new Date(),
      });
      return;
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
      const lock = await client.getMailboxLock(folder.remoteName);
      try {
        await client.messageFlagsAdd(message.remoteUid, ['\\Deleted'], {
          uid: true,
        });
        await client.mailboxClose();
      } finally {
        lock.release();
      }

      await this.emailMessagesRepository.update({
        id: message.id.toString(),
        tenantId,
        deletedAt: new Date(),
      });
    } catch (_error) {
      throw new BadRequestError('Failed to delete email message');
    } finally {
      await client.logout().catch(() => undefined);
    }
  }
}
