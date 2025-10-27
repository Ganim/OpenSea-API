import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type NotificationPreferenceDTO,
  notificationPreferenceToDTO,
} from '@/mappers/sales/notification-preference/notification-preference-to-dto';
import { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';

interface DeleteNotificationPreferenceRequest {
  id: string;
}

interface DeleteNotificationPreferenceResponse {
  preference: NotificationPreferenceDTO;
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

    return { preference: notificationPreferenceToDTO(preference) };
  }
}
