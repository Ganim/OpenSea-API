import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export interface ChatbotConfigProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  greeting: string;
  autoReplyMessage?: string;
  assignToUserId?: string;
  formId?: string;
  primaryColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export class ChatbotConfig extends Entity<ChatbotConfigProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get greeting(): string {
    return this.props.greeting;
  }

  set greeting(value: string) {
    this.props.greeting = value;
    this.touch();
  }

  get autoReplyMessage(): string | undefined {
    return this.props.autoReplyMessage;
  }

  set autoReplyMessage(value: string | undefined) {
    this.props.autoReplyMessage = value;
    this.touch();
  }

  get assignToUserId(): string | undefined {
    return this.props.assignToUserId;
  }

  set assignToUserId(value: string | undefined) {
    this.props.assignToUserId = value;
    this.touch();
  }

  get formId(): string | undefined {
    return this.props.formId;
  }

  set formId(value: string | undefined) {
    this.props.formId = value;
    this.touch();
  }

  get primaryColor(): string {
    return this.props.primaryColor;
  }

  set primaryColor(value: string) {
    this.props.primaryColor = value;
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<
      ChatbotConfigProps,
      'id' | 'createdAt' | 'greeting' | 'primaryColor' | 'isActive'
    >,
    id?: UniqueEntityID,
  ): ChatbotConfig {
    return new ChatbotConfig(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        greeting: props.greeting ?? 'Olá! Como posso ajudar?',
        primaryColor: props.primaryColor ?? '#6366f1',
        isActive: props.isActive ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
