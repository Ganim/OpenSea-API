import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface AiMessageProps {
  conversationId: UniqueEntityID;
  role: string;
  content?: string | null;
  contentType: string;
  renderData?: Record<string, unknown> | null;
  attachments?: Record<string, unknown> | null;
  aiTier?: number | null;
  aiModel?: string | null;
  aiTokensInput?: number | null;
  aiTokensOutput?: number | null;
  aiLatencyMs?: number | null;
  aiCost?: number | null;
  toolCalls?: Record<string, unknown> | null;
  actionsTaken?: Record<string, unknown> | null;
  audioUrl?: string | null;
  transcription?: string | null;
  createdAt: Date;
}

export class AiMessage extends Entity<AiMessageProps> {
  get conversationId(): UniqueEntityID {
    return this.props.conversationId;
  }

  get role(): string {
    return this.props.role;
  }

  get content(): string | null {
    return this.props.content ?? null;
  }

  get contentType(): string {
    return this.props.contentType;
  }

  get renderData(): Record<string, unknown> | null {
    return this.props.renderData ?? null;
  }

  get attachments(): Record<string, unknown> | null {
    return this.props.attachments ?? null;
  }

  get aiTier(): number | null {
    return this.props.aiTier ?? null;
  }

  get aiModel(): string | null {
    return this.props.aiModel ?? null;
  }

  get aiTokensInput(): number | null {
    return this.props.aiTokensInput ?? null;
  }

  get aiTokensOutput(): number | null {
    return this.props.aiTokensOutput ?? null;
  }

  get aiLatencyMs(): number | null {
    return this.props.aiLatencyMs ?? null;
  }

  get aiCost(): number | null {
    return this.props.aiCost ?? null;
  }

  get toolCalls(): Record<string, unknown> | null {
    return this.props.toolCalls ?? null;
  }

  get actionsTaken(): Record<string, unknown> | null {
    return this.props.actionsTaken ?? null;
  }

  get audioUrl(): string | null {
    return this.props.audioUrl ?? null;
  }

  get transcription(): string | null {
    return this.props.transcription ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(
    props: Omit<AiMessageProps, 'createdAt' | 'contentType'> & {
      createdAt?: Date;
      contentType?: string;
    },
    id?: UniqueEntityID,
  ): AiMessage {
    return new AiMessage(
      {
        ...props,
        contentType: props.contentType ?? 'TEXT',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
