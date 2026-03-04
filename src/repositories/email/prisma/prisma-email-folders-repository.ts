import type { EmailFolder } from '@/entities/email/email-folder';
import { prisma } from '@/lib/prisma';
import { emailFolderPrismaToDomain } from '@/mappers/email';
import type {
  CreateEmailFolderSchema,
  EmailFoldersRepository,
  FolderMessageCounts,
  UpdateEmailFolderSchema,
} from '../email-folders-repository';

export class PrismaEmailFoldersRepository implements EmailFoldersRepository {
  async create(data: CreateEmailFolderSchema): Promise<EmailFolder> {
    const folderDb = await prisma.emailFolder.create({
      data: {
        accountId: data.accountId,
        remoteName: data.remoteName,
        displayName: data.displayName,
        type: data.type ?? 'CUSTOM',
        uidValidity: data.uidValidity ?? null,
        lastUid: data.lastUid ?? null,
      },
    });

    return emailFolderPrismaToDomain(folderDb);
  }

  async findById(id: string, accountId: string): Promise<EmailFolder | null> {
    const folderDb = await prisma.emailFolder.findFirst({
      where: { id, accountId },
    });

    return folderDb ? emailFolderPrismaToDomain(folderDb) : null;
  }

  async findByType(
    accountId: string,
    type: string,
  ): Promise<EmailFolder | null> {
    const folderDb = await prisma.emailFolder.findFirst({
      where: {
        accountId,
        type: type as 'INBOX' | 'SENT' | 'DRAFTS' | 'TRASH' | 'SPAM' | 'CUSTOM',
      },
    });

    return folderDb ? emailFolderPrismaToDomain(folderDb) : null;
  }

  async findByRemoteName(
    accountId: string,
    remoteName: string,
  ): Promise<EmailFolder | null> {
    const folderDb = await prisma.emailFolder.findFirst({
      where: { accountId, remoteName },
    });

    return folderDb ? emailFolderPrismaToDomain(folderDb) : null;
  }

  async listByAccount(accountId: string): Promise<EmailFolder[]> {
    const folders = await prisma.emailFolder.findMany({
      where: { accountId },
      orderBy: [{ type: 'asc' }, { displayName: 'asc' }],
    });

    return folders.map(emailFolderPrismaToDomain);
  }

  async getMessageCounts(accountId: string): Promise<FolderMessageCounts[]> {
    const results = await prisma.emailMessage.groupBy({
      by: ['folderId'],
      where: {
        accountId,
        deletedAt: null,
      },
      _count: {
        _all: true,
      },
    });

    const unreadResults = await prisma.emailMessage.groupBy({
      by: ['folderId'],
      where: {
        accountId,
        deletedAt: null,
        isRead: false,
      },
      _count: {
        _all: true,
      },
    });

    const unreadMap = new Map(
      unreadResults.map((r) => [r.folderId, r._count._all]),
    );

    return results.map((r) => ({
      folderId: r.folderId,
      totalMessages: r._count._all,
      unreadMessages: unreadMap.get(r.folderId) ?? 0,
    }));
  }

  async update(data: UpdateEmailFolderSchema): Promise<EmailFolder | null> {
    const folderDb = await prisma.emailFolder.update({
      where: { id: data.id },
      data: {
        ...(data.displayName !== undefined && {
          displayName: data.displayName,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.uidValidity !== undefined && {
          uidValidity: data.uidValidity,
        }),
        ...(data.lastUid !== undefined && { lastUid: data.lastUid }),
      },
    });

    return folderDb ? emailFolderPrismaToDomain(folderDb) : null;
  }

  async delete(id: string, accountId: string): Promise<void> {
    await prisma.emailFolder.delete({ where: { id, accountId } });
  }
}
