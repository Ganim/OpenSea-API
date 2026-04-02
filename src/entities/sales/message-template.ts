import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type MessageChannelType = 'EMAIL' | 'WHATSAPP' | 'SMS' | 'NOTIFICATION';

export interface MessageTemplateProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  name: string;
  channel: MessageChannelType;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class MessageTemplate extends Entity<MessageTemplateProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get tenantId(): UniqueEntityID {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  set name(value: string) {
    this.props.name = value;
    this.touch();
  }

  get channel(): MessageChannelType {
    return this.props.channel;
  }

  set channel(value: MessageChannelType) {
    this.props.channel = value;
    this.touch();
  }

  get subject(): string | undefined {
    return this.props.subject;
  }

  set subject(value: string | undefined) {
    this.props.subject = value;
    this.touch();
  }

  get body(): string {
    return this.props.body;
  }

  set body(value: string) {
    this.props.body = value;
    this.props.variables = MessageTemplate.extractVariables(value);
    this.touch();
  }

  get variables(): string[] {
    return this.props.variables;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  set isActive(value: boolean) {
    this.props.isActive = value;
    this.touch();
  }

  get createdBy(): string {
    return this.props.createdBy;
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

  delete() {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.props.isActive = true;
    this.touch();
  }

  static extractVariables(bodyText: string): string[] {
    const matches = bodyText.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    const variableNames = matches.map((match) =>
      match.replace(/\{\{|\}\}/g, ''),
    );
    return [...new Set(variableNames)];
  }

  renderPreview(sampleData: Record<string, string>): string {
    return this.body.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return sampleData[key] ?? match;
    });
  }

  static create(
    props: Optional<
      MessageTemplateProps,
      'id' | 'isActive' | 'variables' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): MessageTemplate {
    const variables =
      props.variables ?? MessageTemplate.extractVariables(props.body);

    return new MessageTemplate(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        variables,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }
}
