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

    // Update DB first (source of truth)
    await this.emailMessagesRepository.update({
      id: message.id.toString(),
      tenantId: request.tenantId,
      isFlagged: request.isFlagged,
    });

    // Sync flag to IMAP (fire-and-forget — DB is already updated)
    this.syncFlagToImap(account, folder, message, request.isFlagged).catch(
      (error) => {
        const reason = error instanceof Error ? error.message : String(error);
        logger.warn(
          {
            err: error,
            messageId: message.id.toString(),
            accountId: account.id.toString(),
          },
          `Failed to sync flag to IMAP (DB updated): ${reason}`,
        );
      },
    );
  }

  private async syncFlagToImap(
    account: {
      imapHost: string;
      imapPort: number;
      imapSecure: boolean;
      tlsVerify: boolean;
      username: string;
      encryptedSecret: string;
      id: { toString(): string };
    },
    folder: { remoteName: string },
    message: { remoteUid: number },
    isFlagged: boolean,
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
        if (isFlagged) {
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
    } catch (err) {
      pool.destroy(accountId);
      throw err;
    } finally {
      pool.release(accountId);
    }
  }
}
