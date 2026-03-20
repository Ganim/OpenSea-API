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

    // Update DB first (source of truth)
    await this.emailMessagesRepository.update({
      id: message.id.toString(),
      tenantId: request.tenantId,
      folderId: targetFolder.id.toString(),
    });

    // Suppress notification for the message appearing in target folder during next sync
    getNotificationSuppressor()
      .suppress(
        account.id.toString(),
        targetFolder.id.toString(),
        message.remoteUid.toString(),
      )
      .catch(() => {});

    // Sync move to IMAP (fire-and-forget — DB is already updated)
    this.syncMoveToImap(account, sourceFolder, targetFolder, message).catch(
      (error) => {
        const reason = error instanceof Error ? error.message : String(error);
        logger.warn(
          {
            err: error,
            messageId: message.id.toString(),
            accountId: account.id.toString(),
          },
          `Failed to sync move to IMAP (DB updated): ${reason}`,
        );
      },
    );
  }

  private async syncMoveToImap(
    account: {
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      tlsVerify: boolean;
      username: string;
      encryptedSecret: string;
      id: { toString(): string };
    },
    sourceFolder: { remoteName: string },
    targetFolder: { remoteName: string },
    message: { remoteUid: number },
  ): Promise<void> {
    const secret = this.credentialCipherService.decrypt(
      account.encryptedSecret,
    );

    const accountIdStr = account.id.toString();
    const pool = getImapConnectionPool();
    const client = await pool.acquire(accountIdStr, {
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
        await client.messageMove(message.remoteUid, targetFolder.remoteName, {
          uid: true,
        });
      } finally {
        lock.release();
      }
    } catch (err) {
      pool.destroy(accountIdStr);
      throw err;
    } finally {
      pool.release(accountIdStr);
    }
  }
}
