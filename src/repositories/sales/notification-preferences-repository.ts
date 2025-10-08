import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type AlertTypeValue,
  type NotificationChannelValue,
  NotificationPreference,
} from '@/entities/sales/notification-preference';

export interface CreateNotificationPreferenceSchema {
  userId: UniqueEntityID;
  alertType: AlertTypeValue;
  channel: NotificationChannelValue;
  isEnabled?: boolean;
}

export interface UpdateNotificationPreferenceSchema {
  id: UniqueEntityID;
  isEnabled?: boolean;
}

export interface NotificationPreferencesRepository {
  create(
    data: CreateNotificationPreferenceSchema,
  ): Promise<NotificationPreference>;
  findById(id: UniqueEntityID): Promise<NotificationPreference | null>;
  findByUserAndAlertType(
    userId: UniqueEntityID,
    alertType: AlertTypeValue,
  ): Promise<NotificationPreference[]>;
  findByUserAndChannel(
    userId: UniqueEntityID,
    channel: NotificationChannelValue,
  ): Promise<NotificationPreference[]>;
  findManyByUser(userId: UniqueEntityID): Promise<NotificationPreference[]>;
  findManyEnabled(userId: UniqueEntityID): Promise<NotificationPreference[]>;
  update(
    data: UpdateNotificationPreferenceSchema,
  ): Promise<NotificationPreference | null>;
  save(preference: NotificationPreference): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
