import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailAccount } from '@/entities/email/email-account';
import type { EmailAccount as PrismaEmailAccount } from '@prisma/generated/client.js';

/** Extended Prisma result with optional team data from include */
type PrismaEmailAccountWithTeam = PrismaEmailAccount & {
  teamLinks?: Array<{
    team: { id: string; name: string };
  }>;
};

export function emailAccountPrismaToDomain(
  accountDb: PrismaEmailAccountWithTeam,
): EmailAccount {
  // Use the first team link if present
  const firstTeam = accountDb.teamLinks?.[0]?.team ?? null;

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
      teamId: firstTeam?.id ?? null,
      teamName: firstTeam?.name ?? null,
    },
    new UniqueEntityID(accountDb.id),
  );
}
