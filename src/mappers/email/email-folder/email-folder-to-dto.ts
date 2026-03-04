import type {
  EmailFolder,
  EmailFolderType,
} from '@/entities/email/email-folder';

export interface EmailFolderDTO {
  id: string;
  accountId: string;
  remoteName: string;
  displayName: string;
  type: EmailFolderType;
  uidValidity: number | null;
  lastUid: number | null;
  totalMessages: number;
  unreadMessages: number;
  updatedAt: Date;
}

export function emailFolderToDTO(
  folder: EmailFolder,
  counts?: { totalMessages: number; unreadMessages: number },
): EmailFolderDTO {
  return {
    id: folder.id.toString(),
    accountId: folder.accountId.toString(),
    remoteName: folder.remoteName,
    displayName: folder.displayName,
    type: folder.type,
    uidValidity: folder.uidValidity,
    lastUid: folder.lastUid,
    totalMessages: counts?.totalMessages ?? 0,
    unreadMessages: counts?.unreadMessages ?? 0,
    updatedAt: folder.updatedAt,
  };
}
