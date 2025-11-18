import { Entity } from '@/entities/domain/entities';
import { Optional } from '@/entities/domain/optional';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  NotificationChannelValue,
  NotificationPriorityValue,
} from './notification';

export interface NotificationTemplateProps {
  id: UniqueEntityID;
  code: string;
  name: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultChannel: NotificationChannelValue;
  defaultPriority: NotificationPriorityValue;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class NotificationTemplate extends Entity<NotificationTemplateProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get titleTemplate(): string {
    return this.props.titleTemplate;
  }
  get messageTemplate(): string {
    return this.props.messageTemplate;
  }
  get defaultChannel() {
    return this.props.defaultChannel;
  }
  get defaultPriority() {
    return this.props.defaultPriority;
  }
  get isActive(): boolean {
    return this.props.isActive;
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

  activate() {
    this.props.isActive = true;
    this.touch();
  }
  deactivate() {
    this.props.isActive = false;
    this.touch();
  }
  delete() {
    this.props.deletedAt = new Date();
    this.touch();
  }
  restore() {
    this.props.deletedAt = undefined;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<NotificationTemplateProps, 'id' | 'isActive' | 'createdAt'>,
    id?: UniqueEntityID,
  ): NotificationTemplate {
    const entity = new NotificationTemplate(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return entity;
  }
}
