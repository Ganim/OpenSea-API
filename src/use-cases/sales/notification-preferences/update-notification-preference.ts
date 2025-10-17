import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { NotificationPreference } from '@/entities/sales/notification-preference';
import { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';

interface UpdateNotificationPreferenceRequest {
  id: string;
  isEnabled?: boolean;
}

interface UpdateNotificationPreferenceResponse {
  preference: NotificationPreference;
}

export class UpdateNotificationPreferenceUseCase {
  constructor(
    private notificationPreferencesRepository: NotificationPreferencesRepository,
  ) {}

  async execute(
    request: UpdateNotificationPreferenceRequest,
  ): Promise<UpdateNotificationPreferenceResponse> {
    const { id, isEnabled } = request;

    const preference = await this.notificationPreferencesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!preference) {
      throw new ResourceNotFoundError('Notification preference not found');
    }

    // Update isEnabled
    if (isEnabled !== undefined) {
      preference.isEnabled = isEnabled;
    }

    await this.notificationPreferencesRepository.save(preference);

    return { preference };
  }
}
