import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export type EmailFolderType =
  | 'INBOX'
  | 'SENT'
  | 'DRAFTS'
  | 'TRASH'
  | 'SPAM'
  | 'CUSTOM';

export interface EmailFolderProps {
  accountId: UniqueEntityID;
  remoteName: string;
  displayName: string;
  type: EmailFolderType;
  uidValidity: number | null;
  lastUid: number | null;
  updatedAt: Date;
}

export class EmailFolder extends Entity<EmailFolderProps> {
  get accountId(): UniqueEntityID {
    return this.props.accountId;
  }

  get remoteName(): string {
    return this.props.remoteName;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  set displayName(value: string) {
    this.props.displayName = value;
    this.touch();
  }

  get type(): EmailFolderType {
    return this.props.type;
  }

  set type(value: EmailFolderType) {
    this.props.type = value;
    this.touch();
  }

  get uidValidity(): number | null {
    return this.props.uidValidity;
  }

  set uidValidity(value: number | null) {
    this.props.uidValidity = value;
    this.touch();
  }

  get lastUid(): number | null {
    return this.props.lastUid;
  }

  set lastUid(value: number | null) {
    this.props.lastUid = value;
    this.touch();
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<
      EmailFolderProps,
      'type' | 'uidValidity' | 'lastUid' | 'updatedAt'
    > & {
      type?: EmailFolderType;
      uidValidity?: number | null;
      lastUid?: number | null;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): EmailFolder {
    return new EmailFolder(
      {
        ...props,
        type: props.type ?? 'CUSTOM',
        uidValidity: props.uidValidity ?? null,
        lastUid: props.lastUid ?? null,
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
