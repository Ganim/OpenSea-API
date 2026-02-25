import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailAccount } from '@/entities/email/email-account';
import type { EmailAccount as PrismaEmailAccount } from '@prisma/generated/client.js';

export function emailAccountPrismaToDomain(
  accountDb: PrismaEmailAccount,
): EmailAccount {
  return EmailAccount.create(
    {
      tenantId: new UniqueEntityID(accountDb.tenantId),
      ownerUserId: new UniqueEntityID(accountDb.ownerUserId),
      address: accountDb.address,
      displayName: accountDb.displayName ?? null,
      imapHost: accountDb.imapHost,
      imapPort: accountDb.imapPort,
      imapSecure: accountDb.imapSecure,
      smtpHost: accountDb.smtpHost,
      smtpPort: accountDb.smtpPort,
      smtpSecure: accountDb.smtpSecure,
      username: accountDb.username,
      encryptedSecret: accountDb.encryptedSecret,
      visibility: accountDb.visibility,
      isActive: accountDb.isActive,
      isDefault: accountDb.isDefault,
      signature: accountDb.signature ?? null,
      lastSyncAt: accountDb.lastSyncAt ?? null,
      createdAt: accountDb.createdAt,
      updatedAt: accountDb.updatedAt,
    },
    new UniqueEntityID(accountDb.id),
  );
}
