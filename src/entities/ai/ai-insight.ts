import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

export interface AiInsightProps {
  tenantId: UniqueEntityID;
  type: string;
  priority: string;
  title: string;
  content: string;
  renderData?: Record<string, unknown> | null;
  module: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  targetUserIds: string[];
  status: string;
  actionUrl?: string | null;
  suggestedAction?: string | null;
  expiresAt?: Date | null;
  viewedAt?: Date | null;
  actedOnAt?: Date | null;
  dismissedAt?: Date | null;
  aiModel?: string | null;
  createdAt: Date;
}

export class AiInsight extends Entity<AiInsightProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get type(): string {
    return this.props.type;
  }

  get priority(): string {
    return this.props.priority;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get renderData(): Record<string, unknown> | null {
    return this.props.renderData ?? null;
  }

  get module(): string {
    return this.props.module;
  }

  get relatedEntityType(): string | null {
    return this.props.relatedEntityType ?? null;
  }

  get relatedEntityId(): string | null {
    return this.props.relatedEntityId ?? null;
  }

  get targetUserIds(): string[] {
    return this.props.targetUserIds;
  }

  get status(): string {
    return this.props.status;
  }

  get actionUrl(): string | null {
    return this.props.actionUrl ?? null;
  }

  get suggestedAction(): string | null {
    return this.props.suggestedAction ?? null;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt ?? null;
  }

  get viewedAt(): Date | null {
    return this.props.viewedAt ?? null;
  }

  get actedOnAt(): Date | null {
    return this.props.actedOnAt ?? null;
  }

  get dismissedAt(): Date | null {
    return this.props.dismissedAt ?? null;
  }

  get aiModel(): string | null {
    return this.props.aiModel ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  markViewed(): void {
    this.props.status = 'VIEWED';
    this.props.viewedAt = new Date();
  }

  dismiss(): void {
    this.props.status = 'DISMISSED';
    this.props.dismissedAt = new Date();
  }

  static create(
    props: Omit<AiInsightProps, 'createdAt' | 'status' | 'priority'> & {
      createdAt?: Date;
      status?: string;
      priority?: string;
    },
    id?: UniqueEntityID,
  ): AiInsight {
    return new AiInsight(
      {
        ...props,
        status: props.status ?? 'NEW',
        priority: props.priority ?? 'MEDIUM',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
