import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { logger } from '@/lib/logger';
import type {
  EmailAccountsRepository,
  EmailFoldersRepository,
  EmailMessagesRepository,
} from '@/repositories/email';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';
import { getImapConnectionPool } from '@/services/email/imap-connection-pool';
import { getNotificationSuppressor } from '@/services/email/notification-suppressor.service';

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
      id: { toString(): string };
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      tlsVerify: boolean;
      username: string;
      encryptedSecret: string;
    },
    sourceFolder: { remoteName: string },
    trashFolder: { id: { toString(): string }; remoteName: string },
    tenantId: string,
  ): Promise<void> {
    // Update DB first (source of truth)
    await this.emailMessagesRepository.update({
      id: message.id.toString(),
      tenantId,
      folderId: trashFolder.id.toString(),
    });

    // Suppress notification for the message appearing in Trash during next sync
    getNotificationSuppressor()
      .suppress(
        account.id.toString(),
        trashFolder.id.toString(),
        message.remoteUid.toString(),
      )
      .catch(() => {});

    // Sync move to IMAP (fire-and-forget — DB is already updated)
    this.syncTrashMoveToImap(account, sourceFolder, trashFolder, message).catch(
      (error) => {
        const reason = error instanceof Error ? error.message : String(error);
        logger.warn(
          {
            err: error,
            messageId: message.id.toString(),
            accountId: account.id.toString(),
          },
          `Failed to sync trash move to IMAP (DB updated): ${reason}`,
        );
      },
    );
  }

  private async permanentlyDeleteMessage(
    message: { id: { toString(): string }; remoteUid: number },
    account: {
      id: { toString(): string };
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      tlsVerify: boolean;
      username: string;
      encryptedSecret: string;
    },
    folder: { remoteName: string },
    tenantId: string,
  ): Promise<void> {
    // Soft-delete in DB first (source of truth)
    await this.emailMessagesRepository.update({
      id: message.id.toString(),
      tenantId,
      deletedAt: new Date(),
    });

    // Sync deletion to IMAP (fire-and-forget — DB is already updated)
    this.syncDeleteToImap(account, folder, message).catch((error) => {
      const reason = error instanceof Error ? error.message : String(error);
      logger.warn(
        {
          err: error,
          messageId: message.id.toString(),
          accountId: account.id.toString(),
        },
        `Failed to sync deletion to IMAP (DB updated): ${reason}`,
      );
    });
  }

  private async syncTrashMoveToImap(
    account: {
      id: { toString(): string };
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      tlsVerify: boolean;
      username: string;
      encryptedSecret: string;
    },
    sourceFolder: { remoteName: string },
    trashFolder: { remoteName: string },
    message: { remoteUid: number },
  ): Promise<void> {
    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const accountId = account.id.toString();
    const pool = getImapConnectionPool();
    const client = await pool.acquire(accountId, {
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      rejectUnauthorized: account.tlsVerify,
    });

    try {
      const lock = await client.getMailboxLock(sourceFolder.remoteName);
      try {
        await client.messageMove(message.remoteUid, trashFolder.remoteName, {
          uid: true,
        });
      } finally {
        lock.release();
      }
    } catch (err) {
      pool.destroy(accountId);
      throw err;
    } finally {
      pool.release(accountId);
    }
  }

  private async syncDeleteToImap(
    account: {
      id: { toString(): string };
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      tlsVerify: boolean;
      username: string;
      encryptedSecret: string;
    },
    folder: { remoteName: string },
    message: { remoteUid: number },
  ): Promise<void> {
    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const accountId = account.id.toString();
    const pool = getImapConnectionPool();
    const client = await pool.acquire(accountId, {
      host: account.imapHost,
      port: account.imapPort,
      secure: account.imapSecure,
      username: account.username,
      secret,
      rejectUnauthorized: account.tlsVerify,
    });

    try {
      const lock = await client.getMailboxLock(folder.remoteName);
      try {
        await client.messageFlagsAdd(message.remoteUid, ['\\Deleted'], {
          uid: true,
        });
        await client.mailboxClose();
      } finally {
        lock.release();
      }
    } catch (err) {
      pool.destroy(accountId);
      throw err;
    } finally {
      pool.release(accountId);
    }
  }
}
