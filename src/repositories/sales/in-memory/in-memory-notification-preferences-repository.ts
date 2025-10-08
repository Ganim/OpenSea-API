import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type AlertTypeValue,
  type NotificationChannelValue,
  NotificationPreference,
} from '@/entities/sales/notification-preference';
import type {
  CreateNotificationPreferenceSchema,
  NotificationPreferencesRepository,
  UpdateNotificationPreferenceSchema,
} from '../notification-preferences-repository';

export class InMemoryNotificationPreferencesRepository
  implements NotificationPreferencesRepository
{
  public items: NotificationPreference[] = [];

  async create(
    data: CreateNotificationPreferenceSchema,
  ): Promise<NotificationPreference> {
    const preference = NotificationPreference.create({
      userId: data.userId,
      alertType: data.alertType,
      channel: data.channel,
      isEnabled: data.isEnabled ?? true,
    });

    this.items.push(preference);
    return preference;
  }

  async findById(id: UniqueEntityID): Promise<NotificationPreference | null> {
    const preference = this.items.find((item) => item.id.equals(id));
    return preference ?? null;
  }

  async findByUserAndAlertType(
    userId: UniqueEntityID,
    alertType: AlertTypeValue,
  ): Promise<NotificationPreference[]> {
    return this.items.filter(
      (item) => item.userId.equals(userId) && item.alertType === alertType,
    );
  }

  async findByUserAndChannel(
    userId: UniqueEntityID,
    channel: NotificationChannelValue,
  ): Promise<NotificationPreference[]> {
    return this.items.filter(
      (item) => item.userId.equals(userId) && item.channel === channel,
    );
  }

  async findManyByUser(
    userId: UniqueEntityID,
  ): Promise<NotificationPreference[]> {
    return this.items.filter((item) => item.userId.equals(userId));
  }

  async findManyEnabled(
    userId: UniqueEntityID,
  ): Promise<NotificationPreference[]> {
    return this.items.filter(
      (item) => item.userId.equals(userId) && item.isEnabled,
    );
  }

  async update(
    data: UpdateNotificationPreferenceSchema,
  ): Promise<NotificationPreference | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) {
      return null;
    }

    const preference = this.items[index];

    if (data.isEnabled !== undefined) preference.isEnabled = data.isEnabled;

    return preference;
  }

  async save(preference: NotificationPreference): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(preference.id));

    if (index >= 0) {
      this.items[index] = preference;
    } else {
      this.items.push(preference);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const preference = await this.findById(id);

    if (preference) {
      preference.disable();
    }
  }
}
