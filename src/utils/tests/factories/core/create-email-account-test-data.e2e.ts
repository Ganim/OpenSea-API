import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

interface CreateEmailAccountOptions {
  id?: string;
  address?: string;
  displayName?: string | null;
}

/**
 * Creates an email account directly in the database for E2E tests.
 */
export async function createEmailAccount(
  tenantId: string,
  ownerUserId: string,
  overrides: CreateEmailAccountOptions = {},
) {
  const id = overrides.id ?? randomUUID();
  const address = overrides.address ?? `team-test-${Date.now()}@example.com`;

  return prisma.emailAccount.create({
    data: {
      id,
      tenantId,
      ownerUserId,
      address,
      displayName: overrides.displayName ?? null,
      imapHost: 'imap.example.com',
      imapPort: 993,
      imapSecure: true,
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpSecure: true,
      username: address,
      encryptedSecret: 'fake-encrypted-secret-for-test',
      visibility: 'SHARED',
      isActive: true,
      isDefault: false,
    },
  });
}
