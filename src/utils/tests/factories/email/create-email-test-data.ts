import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  EmailAccount,
  type EmailAccountVisibility,
} from '@/entities/email/email-account';
import type { EmailFolder } from '@/entities/email/email-folder';
import type { EmailMessage } from '@/entities/email/email-message';
import { InMemoryEmailAccountsRepository } from '@/repositories/email/in-memory/in-memory-email-accounts-repository';
import { InMemoryEmailFoldersRepository } from '@/repositories/email/in-memory/in-memory-email-folders-repository';
import { InMemoryEmailMessagesRepository } from '@/repositories/email/in-memory/in-memory-email-messages-repository';
import type { CredentialCipherService } from '@/services/email/credential-cipher.service';

// ---------------------------------------------------------------------------
// Repository bundle
// ---------------------------------------------------------------------------

export interface EmailTestRepositories {
  accountsRepository: InMemoryEmailAccountsRepository;
  foldersRepository: InMemoryEmailFoldersRepository;
  messagesRepository: InMemoryEmailMessagesRepository;
}

/**
 * Creates all three in-memory email repositories.
 */
export function createEmailTestRepositories(): EmailTestRepositories {
  return {
    accountsRepository: new InMemoryEmailAccountsRepository(),
    foldersRepository: new InMemoryEmailFoldersRepository(),
    messagesRepository: new InMemoryEmailMessagesRepository(),
  };
}

// ---------------------------------------------------------------------------
// Mock cipher service
// ---------------------------------------------------------------------------

/**
 * Creates a deterministic mock `CredentialCipherService` that prefixes with
 * `enc:` on encrypt and strips it on decrypt. This avoids the need for a
 * real AES key in unit tests.
 */
export function createMockCipherService(): CredentialCipherService {
  return {
    encrypt(value: string) {
      return `enc:${value}`;
    },
    decrypt(value: string) {
      return value.replace(/^enc:/, '');
    },
  } as CredentialCipherService;
}

// ---------------------------------------------------------------------------
// Account factory
// ---------------------------------------------------------------------------

interface CreateEmailTestAccountOverrides {
  tenantId?: string;
  ownerUserId?: string;
  address?: string;
  displayName?: string | null;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  tlsVerify?: boolean;
  username?: string;
  encryptedSecret?: string;
  visibility?: EmailAccountVisibility;
  isActive?: boolean;
  isDefault?: boolean;
  signature?: string | null;
}

/**
 * Creates a test email account with sensible defaults (overridable).
 * The account is persisted in the in-memory accounts repository.
 */
export async function createEmailTestAccount(
  repos: EmailTestRepositories,
  overrides: CreateEmailTestAccountOverrides = {},
): Promise<EmailAccount> {
  return repos.accountsRepository.create({
    tenantId: overrides.tenantId ?? 'tenant-1',
    ownerUserId: overrides.ownerUserId ?? 'user-1',
    address: overrides.address ?? 'user@example.com',
    displayName: overrides.displayName ?? 'Test User',
    imapHost: overrides.imapHost ?? 'imap.example.com',
    imapPort: overrides.imapPort ?? 993,
    imapSecure: overrides.imapSecure ?? true,
    smtpHost: overrides.smtpHost ?? 'smtp.example.com',
    smtpPort: overrides.smtpPort ?? 587,
    smtpSecure: overrides.smtpSecure ?? true,
    tlsVerify: overrides.tlsVerify,
    username: overrides.username ?? 'user@example.com',
    encryptedSecret: overrides.encryptedSecret ?? 'enc:password',
    visibility: overrides.visibility,
    isActive: overrides.isActive ?? true,
    isDefault: overrides.isDefault,
    signature: overrides.signature ?? null,
  });
}

// ---------------------------------------------------------------------------
// Folder factory
// ---------------------------------------------------------------------------

interface CreateEmailTestFolderOverrides {
  displayName?: string;
  remoteName?: string;
  type?: 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM' | 'CUSTOM';
  uidValidity?: number | null;
  lastUid?: number | null;
}

/**
 * Creates a test email folder linked to the given account.
 * The folder is persisted in the in-memory folders repository.
 */
export async function createEmailTestFolder(
  repos: EmailTestRepositories,
  accountId: string,
  overrides: CreateEmailTestFolderOverrides = {},
): Promise<EmailFolder> {
  return repos.foldersRepository.create({
    accountId,
    remoteName: overrides.remoteName ?? 'INBOX',
    displayName: overrides.displayName ?? 'Inbox',
    type: overrides.type ?? 'INBOX',
    uidValidity: overrides.uidValidity ?? 100,
    lastUid: overrides.lastUid ?? 0,
  });
}

// ---------------------------------------------------------------------------
// Message factory
// ---------------------------------------------------------------------------

interface CreateEmailTestMessageOverrides {
  tenantId?: string;
  remoteUid?: number;
  messageId?: string | null;
  threadId?: string | null;
  fromAddress?: string;
  fromName?: string | null;
  toAddresses?: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  subject?: string;
  snippet?: string | null;
  bodyText?: string | null;
  bodyHtmlSanitized?: string | null;
  receivedAt?: Date;
  sentAt?: Date | null;
  isRead?: boolean;
  isFlagged?: boolean;
  isAnswered?: boolean;
  hasAttachments?: boolean;
}

/** Auto-incrementing counter used when no remoteUid is provided. */
let messageUidCounter = 1;

/**
 * Resets the internal message UID counter. Call this in `beforeEach` if your
 * test suite relies on predictable UIDs.
 */
export function resetMessageUidCounter(): void {
  messageUidCounter = 1;
}

/**
 * Creates a test email message linked to the given account and folder.
 * The message is persisted in the in-memory messages repository.
 *
 * When `tenantId` is not provided, it defaults to `'tenant-1'`. The
 * `remoteUid` auto-increments unless explicitly overridden.
 */
export async function createEmailTestMessage(
  repos: EmailTestRepositories,
  accountId: string,
  folderId: string,
  overrides: CreateEmailTestMessageOverrides = {},
): Promise<EmailMessage> {
  const uid = overrides.remoteUid ?? messageUidCounter++;

  return repos.messagesRepository.create({
    tenantId: overrides.tenantId ?? 'tenant-1',
    accountId,
    folderId,
    remoteUid: uid,
    messageId: overrides.messageId,
    threadId: overrides.threadId,
    fromAddress: overrides.fromAddress ?? 'sender@example.com',
    fromName: overrides.fromName,
    toAddresses: overrides.toAddresses ?? ['recipient@example.com'],
    ccAddresses: overrides.ccAddresses,
    bccAddresses: overrides.bccAddresses,
    subject: overrides.subject ?? `Test Email ${uid}`,
    snippet: overrides.snippet,
    bodyText: overrides.bodyText,
    bodyHtmlSanitized: overrides.bodyHtmlSanitized,
    receivedAt: overrides.receivedAt ?? new Date(),
    sentAt: overrides.sentAt,
    isRead: overrides.isRead,
    isFlagged: overrides.isFlagged,
    isAnswered: overrides.isAnswered,
    hasAttachments: overrides.hasAttachments,
  });
}

// ---------------------------------------------------------------------------
// Full setup helper
// ---------------------------------------------------------------------------

interface CreateEmailTestSetupOptions {
  tenantId?: string;
  ownerUserId?: string;
  messageCount?: number;
  /** Overrides applied to the account. */
  accountOverrides?: CreateEmailTestAccountOverrides;
  /** Overrides applied to the folder. */
  folderOverrides?: CreateEmailTestFolderOverrides;
}

interface EmailTestSetup {
  repos: EmailTestRepositories;
  account: EmailAccount;
  folder: EmailFolder;
  messages: EmailMessage[];
  cipherService: CredentialCipherService;
}

/**
 * Creates a complete test setup: repositories, cipher service, one account,
 * one INBOX folder, and optionally N messages.
 *
 * This is the recommended entry point for tests that need a ready-to-use
 * email environment.
 */
export async function createEmailTestSetup(
  options: CreateEmailTestSetupOptions = {},
): Promise<EmailTestSetup> {
  const tenantId = options.tenantId ?? 'tenant-1';
  const ownerUserId = options.ownerUserId ?? 'user-1';

  const repos = createEmailTestRepositories();
  const cipherService = createMockCipherService();

  const account = await createEmailTestAccount(repos, {
    tenantId,
    ownerUserId,
    ...options.accountOverrides,
  });

  const folder = await createEmailTestFolder(
    repos,
    account.id.toString(),
    options.folderOverrides,
  );

  const messages: EmailMessage[] = [];
  const count = options.messageCount ?? 0;

  for (let i = 0; i < count; i++) {
    const msg = await createEmailTestMessage(
      repos,
      account.id.toString(),
      folder.id.toString(),
      { tenantId },
    );
    messages.push(msg);
  }

  return { repos, account, folder, messages, cipherService };
}

// ---------------------------------------------------------------------------
// Account entity factory (without repository persistence)
// ---------------------------------------------------------------------------

/**
 * Creates an `EmailAccount` entity directly (without persisting to a
 * repository). Useful in sync tests that pass the entity to use cases
 * without going through the repository `create` method.
 */
export function makeEmailAccountEntity(
  overrides: CreateEmailTestAccountOverrides & { id?: string } = {},
): EmailAccount {
  return EmailAccount.create(
    {
      tenantId: new UniqueEntityID(overrides.tenantId ?? 'tenant-1'),
      ownerUserId: new UniqueEntityID(overrides.ownerUserId ?? 'user-1'),
      address: overrides.address ?? 'user@example.com',
      imapHost: overrides.imapHost ?? 'imap.example.com',
      imapPort: overrides.imapPort ?? 993,
      smtpHost: overrides.smtpHost ?? 'smtp.example.com',
      smtpPort: overrides.smtpPort ?? 587,
      username: overrides.username ?? 'user@example.com',
      encryptedSecret: overrides.encryptedSecret ?? 'enc:password',
      displayName: overrides.displayName ?? 'Test User',
      imapSecure: overrides.imapSecure,
      smtpSecure: overrides.smtpSecure,
      tlsVerify: overrides.tlsVerify,
      visibility: overrides.visibility,
      isActive: overrides.isActive ?? true,
      isDefault: overrides.isDefault,
      signature: overrides.signature ?? null,
    },
    overrides.id ? new UniqueEntityID(overrides.id) : undefined,
  );
}
