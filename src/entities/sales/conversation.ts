import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ConversationProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  customerId: UniqueEntityID;
  subject: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  lastMessageAt?: Date;
  createdBy: string;
  overallSentiment?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Conversation extends Entity<ConversationProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get customerId(): UniqueEntityID {
    return this.props.customerId;
  }

  get subject(): string {
    return this.props.subject;
  }

  set subject(value: string) {
    this.props.subject = value;
    this.touch();
  }

  get status(): 'OPEN' | 'CLOSED' | 'ARCHIVED' {
    return this.props.status;
  }

  set status(value: 'OPEN' | 'CLOSED' | 'ARCHIVED') {
    this.props.status = value;
    this.touch();
  }

  get lastMessageAt(): Date | undefined {
    return this.props.lastMessageAt;
  }

  set lastMessageAt(value: Date | undefined) {
    this.props.lastMessageAt = value;
    this.touch();
  }

  get createdBy(): string {
    return this.props.createdBy;
  }

  get overallSentiment(): string | undefined {
    return this.props.overallSentiment;
  }

  set overallSentiment(value: string | undefined) {
    this.props.overallSentiment = value;
    this.touch();
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  close() {
    this.props.status = 'CLOSED';
    this.touch();
  }

  archive() {
    this.props.status = 'ARCHIVED';
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  static create(
    props: Optional<
      ConversationProps,
      'id' | 'isActive' | 'createdAt' | 'status'
    >,
    id?: UniqueEntityID,
  ): Conversation {
    const conversation = new Conversation(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        status: props.status ?? 'OPEN',
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return conversation;
  }
}
