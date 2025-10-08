import type { NotificationPreference } from '@/entities/sales/notification-preference';

export interface NotificationPreferenceDTO {
  id: string;
  userId: string;
  alertType: string;
  channel: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export function notificationPreferenceToDTO(
  preference: NotificationPreference,
): NotificationPreferenceDTO {
  return {
    id: preference.id.toString(),
    userId: preference.userId.toString(),
    alertType: preference.alertType,
    channel: preference.channel,
    isEnabled: preference.isEnabled,
    createdAt: preference.createdAt,
    updatedAt: preference.updatedAt,
  };
}
