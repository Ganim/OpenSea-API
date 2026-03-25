import { Entity } from '@/entities/domain/entities';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { MessagingTemplateCategory } from './messaging-template-category.enum';
import type { MessagingTemplateStatus } from './messaging-template-status.enum';

export interface MessagingTemplateProps {
  tenantId: UniqueEntityID;
  accountId: UniqueEntityID;
  name: string;
  language: string;
  category: MessagingTemplateCategory;
  status: MessagingTemplateStatus;
  components: Record<string, unknown>[];
  externalId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MessagingTemplate extends Entity<MessagingTemplateProps> {
  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get accountId(): UniqueEntityID {
    return this.props.accountId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get language(): string {
    return this.props.language;
  }

  set language(value: string) {
    this.props.language = value;
    this.touch();
  }

  get category(): MessagingTemplateCategory {
    return this.props.category;
  }

  set category(value: MessagingTemplateCategory) {
    this.props.category = value;
    this.touch();
  }

  get status(): MessagingTemplateStatus {
    return this.props.status;
  }

  set status(value: MessagingTemplateStatus) {
    this.props.status = value;
    this.touch();
  }

  get components(): Record<string, unknown>[] {
    return this.props.components;
  }

  set components(value: Record<string, unknown>[]) {
    this.props.components = value;
    this.touch();
  }

  get externalId(): string | null {
    return this.props.externalId;
  }

  set externalId(value: string | null) {
    this.props.externalId = value;
    this.touch();
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Omit<
      MessagingTemplateProps,
      'status' | 'components' | 'externalId' | 'createdAt' | 'updatedAt'
    > & {
      status?: MessagingTemplateStatus;
      components?: Record<string, unknown>[];
      externalId?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: UniqueEntityID,
  ): MessagingTemplate {
    return new MessagingTemplate(
      {
        ...props,
        status: props.status ?? 'PENDING',
        components: props.components ?? [],
        externalId: props.externalId ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
