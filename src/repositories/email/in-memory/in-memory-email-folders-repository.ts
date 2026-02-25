import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailFolder } from '@/entities/email/email-folder';
import type {
    CreateEmailFolderSchema,
    EmailFoldersRepository,
    UpdateEmailFolderSchema,
} from '../email-folders-repository';

export class InMemoryEmailFoldersRepository implements EmailFoldersRepository {
  public items: EmailFolder[] = [];

  async create(data: CreateEmailFolderSchema): Promise<EmailFolder> {
    const folder = EmailFolder.create(
      {
        accountId: new UniqueEntityID(data.accountId),
        remoteName: data.remoteName,
        displayName: data.displayName,
        type: data.type ?? 'CUSTOM',
        uidValidity: data.uidValidity ?? null,
        lastUid: data.lastUid ?? null,
      },
      new UniqueEntityID(),
    );

    this.items.push(folder);
    return folder;
  }

  async findById(id: string, accountId: string): Promise<EmailFolder | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id && item.accountId.toString() === accountId,
      ) ?? null
    );
  }

  async findByRemoteName(
    accountId: string,
    remoteName: string,
  ): Promise<EmailFolder | null> {
    return (
      this.items.find(
        (item) =>
          item.accountId.toString() === accountId &&
          item.remoteName === remoteName,
      ) ?? null
    );
  }

  async listByAccount(accountId: string): Promise<EmailFolder[]> {
    return this.items.filter((item) => item.accountId.toString() === accountId);
  }

  async update(data: UpdateEmailFolderSchema): Promise<EmailFolder | null> {
    const folder = this.items.find(
      (item) =>
        item.id.toString() === data.id &&
        item.accountId.toString() === data.accountId,
    );

    if (!folder) return null;

    if (data.displayName !== undefined) folder.displayName = data.displayName;
    if (data.type !== undefined) folder.type = data.type;
    if (data.uidValidity !== undefined) folder.uidValidity = data.uidValidity;
    if (data.lastUid !== undefined) folder.lastUid = data.lastUid;

    return folder;
  }

  async delete(id: string, accountId: string): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(item.id.toString() === id && item.accountId.toString() === accountId),
    );
  }
}
