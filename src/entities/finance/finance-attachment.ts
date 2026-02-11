import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface FinanceAttachmentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  entryId: UniqueEntityID;
  type: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: string;
  createdAt: Date;
}

export class FinanceAttachment extends Entity<FinanceAttachmentProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }
  get entryId(): UniqueEntityID {
    return this.props.entryId;
  }
  get type(): string {
    return this.props.type;
  }
  get fileName(): string {
    return this.props.fileName;
  }
  get fileKey(): string {
    return this.props.fileKey;
  }
  get fileSize(): number {
    return this.props.fileSize;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get uploadedBy(): string | undefined {
    return this.props.uploadedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<FinanceAttachmentProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): FinanceAttachment {
    return new FinanceAttachment(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
