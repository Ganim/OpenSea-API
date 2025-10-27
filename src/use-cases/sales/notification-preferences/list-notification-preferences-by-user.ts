import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type NotificationPreferenceDTO,
  notificationPreferenceToDTO,
} from '@/mappers/sales/notification-preference/notification-preference-to-dto';
import { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';

interface ListNotificationPreferencesByUserRequest {
  userId: string;
  enabledOnly?: boolean;
}

interface ListNotificationPreferencesByUserResponse {
  preferences: NotificationPreferenceDTO[];
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

    let preferences: Awaited<
      ReturnType<NotificationPreferencesRepository['findManyByUser']>
    >;

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

    return { preferences: preferences.map(notificationPreferenceToDTO) };
  }
}
