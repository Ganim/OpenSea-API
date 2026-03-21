import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type TicketAuthorType = 'TENANT_USER' | 'CENTRAL_TEAM' | 'AI_ASSISTANT';

export interface SupportTicketMessageProps {
  id: UniqueEntityID;
  ticketId: string;
  authorId: string | null;
  authorType: TicketAuthorType;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SupportTicketMessage extends Entity<SupportTicketMessageProps> {
  get supportTicketMessageId(): UniqueEntityID {
    return this.props.id;
  }
  get ticketId(): string {
    return this.props.ticketId;
  }
  get authorId(): string | null {
    return this.props.authorId;
  }
  get authorType(): TicketAuthorType {
    return this.props.authorType;
  }
  get body(): string {
    return this.props.body;
  }
  get isInternal(): boolean {
    return this.props.isInternal;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<
      SupportTicketMessageProps,
      'id' | 'authorId' | 'isInternal' | 'createdAt' | 'updatedAt'
    >,
    id?: UniqueEntityID,
  ): SupportTicketMessage {
    const messageId = id ?? props.id ?? new UniqueEntityID();
    return new SupportTicketMessage(
      {
        ...props,
        id: messageId,
        authorId: props.authorId ?? null,
        isInternal: props.isInternal ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      messageId,
    );
  }
}
