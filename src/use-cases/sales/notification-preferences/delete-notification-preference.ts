import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { NotificationPreference } from '@/entities/sales/notification-preference';
import { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';

interface DeleteNotificationPreferenceRequest {
  id: string;
}

interface DeleteNotificationPreferenceResponse {
  preference: NotificationPreference;
}

export class DeleteNotificationPreferenceUseCase {
  constructor(
    private notificationPreferencesRepository: NotificationPreferencesRepository,
  ) {}

  async execute(
    request: DeleteNotificationPreferenceRequest,
  ): Promise<DeleteNotificationPreferenceResponse> {
    const { id } = request;

    const preference = await this.notificationPreferencesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!preference) {
      throw new ResourceNotFoundError('Notification preference not found');
    }

    preference.delete();
    await this.notificationPreferencesRepository.save(preference);

    return { preference };
  }
}
