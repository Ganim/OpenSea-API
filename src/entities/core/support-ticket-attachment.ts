import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface SupportTicketAttachmentProps {
  id: UniqueEntityID;
  ticketId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}

export class SupportTicketAttachment extends Entity<SupportTicketAttachmentProps> {
  get supportTicketAttachmentId(): UniqueEntityID {
    return this.props.id;
  }
  get ticketId(): string {
    return this.props.ticketId;
  }
  get fileName(): string {
    return this.props.fileName;
  }
  get fileUrl(): string {
    return this.props.fileUrl;
  }
  get fileSize(): number {
    return this.props.fileSize;
  }
  get mimeType(): string {
    return this.props.mimeType;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Optional<SupportTicketAttachmentProps, 'id' | 'createdAt'>,
    id?: UniqueEntityID,
  ): SupportTicketAttachment {
    const attachmentId = id ?? props.id ?? new UniqueEntityID();
    return new SupportTicketAttachment(
      {
        ...props,
        id: attachmentId,
        createdAt: props.createdAt ?? new Date(),
      },
      attachmentId,
    );
  }
}
