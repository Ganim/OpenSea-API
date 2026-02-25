import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface EmailAttachmentProps {
  messageId: UniqueEntityID;
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
  createdAt: Date;
}

export class EmailAttachment extends Entity<EmailAttachmentProps> {
  get messageId(): UniqueEntityID {
    return this.props.messageId;
  }

  get filename(): string {
    return this.props.filename;
  }

  get contentType(): string {
    return this.props.contentType;
  }

  get size(): number {
    return this.props.size;
  }

  get storageKey(): string {
    return this.props.storageKey;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Omit<EmailAttachmentProps, 'createdAt'> & { createdAt?: Date },
    id?: UniqueEntityID,
  ): EmailAttachment {
    return new EmailAttachment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
