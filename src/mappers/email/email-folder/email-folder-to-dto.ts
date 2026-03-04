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
  updatedAt: Date;
}

export function emailFolderToDTO(folder: EmailFolder): EmailFolderDTO {
  return {
    id: folder.id.toString(),
    accountId: folder.accountId.toString(),
    remoteName: folder.remoteName,
    displayName: folder.displayName,
    type: folder.type,
    uidValidity: folder.uidValidity,
    lastUid: folder.lastUid,
    updatedAt: folder.updatedAt,
  };
}
