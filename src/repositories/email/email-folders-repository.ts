import type {
  EmailFolder,
  EmailFolderType,
} from '@/entities/email/email-folder';

export interface CreateEmailFolderSchema {
  accountId: string;
  remoteName: string;
  displayName: string;
  type?: EmailFolderType;
  uidValidity?: number | null;
  lastUid?: number | null;
}

export interface UpdateEmailFolderSchema {
  id: string;
  accountId: string;
  displayName?: string;
  type?: EmailFolderType;
  uidValidity?: number | null;
  lastUid?: number | null;
}

export interface EmailFoldersRepository {
  create(data: CreateEmailFolderSchema): Promise<EmailFolder>;
  findById(id: string, accountId: string): Promise<EmailFolder | null>;
  findByType(
    accountId: string,
    type: EmailFolderType,
  ): Promise<EmailFolder | null>;
  findByRemoteName(
    accountId: string,
    remoteName: string,
  ): Promise<EmailFolder | null>;
  listByAccount(accountId: string): Promise<EmailFolder[]>;
  update(data: UpdateEmailFolderSchema): Promise<EmailFolder | null>;
  delete(id: string, accountId: string): Promise<void>;
}
