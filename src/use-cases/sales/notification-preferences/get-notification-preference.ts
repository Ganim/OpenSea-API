import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type NotificationPreferenceDTO,
  notificationPreferenceToDTO,
} from '@/mappers/sales/notification-preference/notification-preference-to-dto';
import { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';

interface GetNotificationPreferenceRequest {
  id: string;
}

interface GetNotificationPreferenceResponse {
  preference: NotificationPreferenceDTO;
}

export class GetNotificationPreferenceUseCase {
  constructor(
    private notificationPreferencesRepository: NotificationPreferencesRepository,
  ) {}

  async execute(
    request: GetNotificationPreferenceRequest,
  ): Promise<GetNotificationPreferenceResponse> {
    const { id } = request;

    const preference = await this.notificationPreferencesRepository.findById(
      new UniqueEntityID(id),
    );

    if (!preference) {
      throw new ResourceNotFoundError('Notification preference not found');
    }

    return { preference: notificationPreferenceToDTO(preference) };
  }
}
