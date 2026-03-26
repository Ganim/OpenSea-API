import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ConversationMessageProps {
  id: UniqueEntityID;
  conversationId: UniqueEntityID;
  senderId?: string;
  senderName: string;
  senderType: string;
  content: string;
  readAt?: Date;
  createdAt: Date;
}

export class ConversationMessage extends Entity<ConversationMessageProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get conversationId(): UniqueEntityID {
    return this.props.conversationId;
  }

  get senderId(): string | undefined {
    return this.props.senderId;
  }

  get senderName(): string {
    return this.props.senderName;
  }

  get senderType(): string {
    return this.props.senderType;
  }

  get content(): string {
    return this.props.content;
  }

  get readAt(): Date | undefined {
    return this.props.readAt;
  }

  set readAt(value: Date | undefined) {
    this.props.readAt = value;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markAsRead() {
    this.props.readAt = new Date();
  }

  static create(
    props: Optional<ConversationMessageProps, 'id' | 'createdAt' | 'senderType'>,
    id?: UniqueEntityID,
  ): ConversationMessage {
    const message = new ConversationMessage(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        senderType: props.senderType ?? 'AGENT',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return message;
  }
}
