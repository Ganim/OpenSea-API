import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { NotificationPreference } from '@/entities/sales/notification-preference';
import { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';

interface ListNotificationPreferencesByUserRequest {
  userId: string;
  enabledOnly?: boolean;
}

interface ListNotificationPreferencesByUserResponse {
  preferences: NotificationPreference[];
}

export class ListNotificationPreferencesByUserUseCase {
  constructor(
    private notificationPreferencesRepository: NotificationPreferencesRepository,
  ) {}

  async execute(
    request: ListNotificationPreferencesByUserRequest,
  ): Promise<ListNotificationPreferencesByUserResponse> {
    const { userId, enabledOnly } = request;

    const userIdEntity = new UniqueEntityID(userId);

    let preferences: NotificationPreference[];

    if (enabledOnly) {
      preferences =
        await this.notificationPreferencesRepository.findManyEnabled(
          userIdEntity,
        );
    } else {
      preferences =
        await this.notificationPreferencesRepository.findManyByUser(
          userIdEntity,
        );
    }

    return { preferences };
  }
}
