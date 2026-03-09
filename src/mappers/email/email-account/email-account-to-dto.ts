import type { EmailAccount } from '@/entities/email/email-account';

export interface EmailAccountDTO {
  id: string;
  address: string;
  displayName: string | null;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  tlsVerify: boolean;
  username: string;
  visibility: 'PRIVATE' | 'SHARED';
  isActive: boolean;
  isDefault: boolean;
  signature: string | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  teamId: string | null;
  teamName: string | null;
}

export function emailAccountToDTO(account: EmailAccount): EmailAccountDTO {
  return {
    id: account.id.toString(),
    address: account.address,
    displayName: account.displayName,
    imapHost: account.imapHost,
    imapPort: account.imapPort,
    imapSecure: account.imapSecure,
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort,
    smtpSecure: account.smtpSecure,
    tlsVerify: account.tlsVerify,
    username: account.username,
    visibility: account.visibility,
    isActive: account.isActive,
    isDefault: account.isDefault,
    signature: account.signature,
    lastSyncAt: account.lastSyncAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    teamId: account.teamId,
    teamName: account.teamName,
  };
}
