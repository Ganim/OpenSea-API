import type { EmailAccount } from '@/entities/email/email-account';
import { prisma } from '@/lib/prisma';
import { emailAccountPrismaToDomain } from '@/mappers/email';
import type {
  CreateEmailAccountSchema,
  EmailAccountAccessItem,
  EmailAccountsRepository,
  UpdateEmailAccountSchema,
  UpsertEmailAccountAccessSchema,
} from '../email-accounts-repository';

export class PrismaEmailAccountsRepository implements EmailAccountsRepository {
  async create(data: CreateEmailAccountSchema): Promise<EmailAccount> {
    const accountDb = await prisma.emailAccount.create({
      data: {
        tenantId: data.tenantId,
        ownerUserId: data.ownerUserId,
        address: data.address,
        displayName: data.displayName ?? null,
        imapHost: data.imapHost,
        imapPort: data.imapPort,
        imapSecure: data.imapSecure ?? true,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure ?? true,
        username: data.username,
        encryptedSecret: data.encryptedSecret,
        visibility: data.visibility ?? 'PRIVATE',
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        signature: data.signature ?? null,
      },
    });

    return emailAccountPrismaToDomain(accountDb);
  }

  async findById(id: string, tenantId: string): Promise<EmailAccount | null> {
    const accountDb = await prisma.emailAccount.findFirst({
      where: { id, tenantId },
    });

    return accountDb ? emailAccountPrismaToDomain(accountDb) : null;
  }

  async findByAddress(
    address: string,
    tenantId: string,
  ): Promise<EmailAccount | null> {
    const accountDb = await prisma.emailAccount.findFirst({
      where: { address, tenantId },
    });

    return accountDb ? emailAccountPrismaToDomain(accountDb) : null;
  }

  async listVisibleByUser(
    tenantId: string,
    userId: string,
  ): Promise<EmailAccount[]> {
    const accounts = await prisma.emailAccount.findMany({
      where: {
        tenantId,
        OR: [{ ownerUserId: userId }, { access: { some: { userId } } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map(emailAccountPrismaToDomain);
  }

  async listOwnedByUser(
    tenantId: string,
    ownerUserId: string,
  ): Promise<EmailAccount[]> {
    const accounts = await prisma.emailAccount.findMany({
      where: { tenantId, ownerUserId },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map(emailAccountPrismaToDomain);
  }

  async listActive(): Promise<EmailAccount[]> {
    const accounts = await prisma.emailAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map(emailAccountPrismaToDomain);
  }

  async update(data: UpdateEmailAccountSchema): Promise<EmailAccount | null> {
    const accountDb = await prisma.emailAccount.update({
      where: { id: data.id },
      data: {
        ...(data.displayName !== undefined && {
          displayName: data.displayName,
        }),
        ...(data.imapHost !== undefined && { imapHost: data.imapHost }),
        ...(data.imapPort !== undefined && { imapPort: data.imapPort }),
        ...(data.imapSecure !== undefined && { imapSecure: data.imapSecure }),
        ...(data.smtpHost !== undefined && { smtpHost: data.smtpHost }),
        ...(data.smtpPort !== undefined && { smtpPort: data.smtpPort }),
        ...(data.smtpSecure !== undefined && { smtpSecure: data.smtpSecure }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.encryptedSecret !== undefined && {
          encryptedSecret: data.encryptedSecret,
        }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.signature !== undefined && { signature: data.signature }),
        ...(data.lastSyncAt !== undefined && { lastSyncAt: data.lastSyncAt }),
      },
    });

    return accountDb ? emailAccountPrismaToDomain(accountDb) : null;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.emailAccount.delete({ where: { id, tenantId } });
  }

  async unsetDefaultAccounts(
    tenantId: string,
    ownerUserId: string,
  ): Promise<void> {
    await prisma.emailAccount.updateMany({
      where: { tenantId, ownerUserId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async upsertAccess(
    data: UpsertEmailAccountAccessSchema,
  ): Promise<EmailAccountAccessItem> {
    const access = await prisma.emailAccountAccess.upsert({
      where: {
        accountId_userId: {
          accountId: data.accountId,
          userId: data.userId,
        },
      },
      create: {
        accountId: data.accountId,
        tenantId: data.tenantId,
        userId: data.userId,
        canRead: data.canRead ?? true,
        canSend: data.canSend ?? false,
        canManage: data.canManage ?? false,
      },
      update: {
        ...(data.canRead !== undefined && { canRead: data.canRead }),
        ...(data.canSend !== undefined && { canSend: data.canSend }),
        ...(data.canManage !== undefined && { canManage: data.canManage }),
      },
    });

    return {
      id: access.id,
      accountId: access.accountId,
      tenantId: access.tenantId,
      userId: access.userId,
      canRead: access.canRead,
      canSend: access.canSend,
      canManage: access.canManage,
      createdAt: access.createdAt,
    };
  }

  async deleteAccess(
    accountId: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    await prisma.emailAccountAccess.deleteMany({
      where: { accountId, userId, tenantId },
    });
  }

  async listAccess(
    accountId: string,
    tenantId: string,
  ): Promise<EmailAccountAccessItem[]> {
    const accesses = await prisma.emailAccountAccess.findMany({
      where: { accountId, tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return accesses.map((access) => ({
      id: access.id,
      accountId: access.accountId,
      tenantId: access.tenantId,
      userId: access.userId,
      canRead: access.canRead,
      canSend: access.canSend,
      canManage: access.canManage,
      createdAt: access.createdAt,
    }));
  }

  async findAccess(
    accountId: string,
    userId: string,
  ): Promise<EmailAccountAccessItem | null> {
    const access = await prisma.emailAccountAccess.findFirst({
      where: { accountId, userId },
    });

    if (!access) return null;

    return {
      id: access.id,
      accountId: access.accountId,
      tenantId: access.tenantId,
      userId: access.userId,
      canRead: access.canRead,
      canSend: access.canSend,
      canManage: access.canManage,
      createdAt: access.createdAt,
    };
  }
}
