import type {
  EmailAccount,
  EmailAccountVisibility,
} from '@/entities/email/email-account';

export interface EmailAccountAccessItem {
  id: string;
  accountId: string;
  tenantId: string;
  userId: string;
  canRead: boolean;
  canSend: boolean;
  canManage: boolean;
  createdAt: Date;
}

export interface CreateEmailAccountSchema {
  tenantId: string;
  ownerUserId: string;
  address: string;
  displayName?: string | null;
  imapHost: string;
  imapPort: number;
  imapSecure?: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean;
  username: string;
  encryptedSecret: string;
  visibility?: EmailAccountVisibility;
  isActive?: boolean;
  isDefault?: boolean;
  signature?: string | null;
}

export interface UpdateEmailAccountSchema {
  id: string;
  tenantId: string;
  displayName?: string | null;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  username?: string;
  encryptedSecret?: string;
  visibility?: EmailAccountVisibility;
  isActive?: boolean;
  isDefault?: boolean;
  signature?: string | null;
  lastSyncAt?: Date | null;
}

export interface UpsertEmailAccountAccessSchema {
  accountId: string;
  tenantId: string;
  userId: string;
  canRead?: boolean;
  canSend?: boolean;
  canManage?: boolean;
}

export interface EmailAccountsRepository {
  create(data: CreateEmailAccountSchema): Promise<EmailAccount>;
  findById(id: string, tenantId: string): Promise<EmailAccount | null>;
  findByAddress(
    address: string,
    tenantId: string,
  ): Promise<EmailAccount | null>;
  listVisibleByUser(tenantId: string, userId: string): Promise<EmailAccount[]>;
  listOwnedByUser(
    tenantId: string,
    ownerUserId: string,
  ): Promise<EmailAccount[]>;
  listActive(): Promise<EmailAccount[]>;
  update(data: UpdateEmailAccountSchema): Promise<EmailAccount | null>;
  delete(id: string, tenantId: string): Promise<void>;
  unsetDefaultAccounts(tenantId: string, ownerUserId: string): Promise<void>;
  upsertAccess(
    data: UpsertEmailAccountAccessSchema,
  ): Promise<EmailAccountAccessItem>;
  deleteAccess(
    accountId: string,
    userId: string,
    tenantId: string,
  ): Promise<void>;
  listAccess(
    accountId: string,
    tenantId: string,
  ): Promise<EmailAccountAccessItem[]>;
  findAccess(
    accountId: string,
    userId: string,
  ): Promise<EmailAccountAccessItem | null>;
}
