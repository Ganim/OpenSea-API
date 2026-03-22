import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface AiConversationProps {
  tenantId: UniqueEntityID;
  userId: UniqueEntityID;
  title?: string | null;
  status: string;
  context: string;
  contextModule?: string | null;
  contextEntityType?: string | null;
  contextEntityId?: string | null;
  messageCount: number;
  lastMessageAt?: Date | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
}

export class AiConversation extends Entity<AiConversationProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get title(): string | null {
    return this.props.title ?? null;
  }

  set title(title: string | null) {
    this.props.title = title;
    this.touch();
  }

  get status(): string {
    return this.props.status;
  }

  set status(status: string) {
    this.props.status = status;
    this.touch();
  }

  get context(): string {
    return this.props.context;
  }

  get contextModule(): string | null {
    return this.props.contextModule ?? null;
  }

  get contextEntityType(): string | null {
    return this.props.contextEntityType ?? null;
  }

  get contextEntityId(): string | null {
    return this.props.contextEntityId ?? null;
  }

  get messageCount(): number {
    return this.props.messageCount;
  }

  set messageCount(count: number) {
    this.props.messageCount = count;
    this.touch();
  }

  get lastMessageAt(): Date | null {
    return this.props.lastMessageAt ?? null;
  }

  set lastMessageAt(date: Date | null) {
    this.props.lastMessageAt = date;
    this.touch();
  }

  get isPinned(): boolean {
    return this.props.isPinned;
  }

  set isPinned(pinned: boolean) {
    this.props.isPinned = pinned;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt ?? null;
  }

  archive(): void {
    this.props.status = 'ARCHIVED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<
      AiConversationProps,
      'createdAt' | 'status' | 'messageCount' | 'isPinned'
    > & {
      createdAt?: Date;
      status?: string;
      messageCount?: number;
      isPinned?: boolean;
    },
    id?: UniqueEntityID,
  ): AiConversation {
    return new AiConversation(
      {
        ...props,
        status: props.status ?? 'ACTIVE',
        messageCount: props.messageCount ?? 0,
        isPinned: props.isPinned ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
