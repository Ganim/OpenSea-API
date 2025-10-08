import { Entity } from '../domain/entities';
import { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

export type AlertTypeValue =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'PRICE_CHANGE'
  | 'REORDER_POINT';

export type NotificationChannelValue = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface NotificationPreferenceProps {
  id: UniqueEntityID;
  userId: UniqueEntityID;
  alertType: AlertTypeValue;
  channel: NotificationChannelValue;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class NotificationPreference extends Entity<NotificationPreferenceProps> {
  get id(): UniqueEntityID {
    return this.props.id;
  }

  get userId(): UniqueEntityID {
    return this.props.userId;
  }

  get alertType(): AlertTypeValue {
    return this.props.alertType;
  }

  get channel(): NotificationChannelValue {
    return this.props.channel;
  }

  get isEnabled(): boolean {
    return this.props.isEnabled;
  }

  set isEnabled(value: boolean) {
    this.props.isEnabled = value;
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

  enable() {
    this.props.isEnabled = true;
    this.touch();
  }

  disable() {
    this.props.isEnabled = false;
    this.touch();
  }

  toggle() {
    this.props.isEnabled = !this.props.isEnabled;
    this.touch();
  }

  delete() {
    this.props.deletedAt = new Date();
    this.props.isEnabled = false;
    this.touch();
  }

  restore() {
    this.props.deletedAt = undefined;
    this.touch();
  }

  static create(
    props: Optional<
      NotificationPreferenceProps,
      'id' | 'isEnabled' | 'createdAt'
    >,
    id?: UniqueEntityID,
  ): NotificationPreference {
    const preference = new NotificationPreference(
      {
        ...props,
        id: id ?? new UniqueEntityID(),
        isEnabled: props.isEnabled ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return preference;
  }
}
