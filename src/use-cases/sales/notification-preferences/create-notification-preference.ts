import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type AlertTypeValue,
  type NotificationChannelValue,
} from '@/entities/sales/notification-preference';
import {
  type NotificationPreferenceDTO,
  notificationPreferenceToDTO,
} from '@/mappers/sales/notification-preference/notification-preference-to-dto';
import { NotificationPreferencesRepository } from '@/repositories/sales/notification-preferences-repository';

interface CreateNotificationPreferenceRequest {
  userId: string;
  alertType: AlertTypeValue;
  channel: NotificationChannelValue;
  isEnabled?: boolean;
}

interface CreateNotificationPreferenceResponse {
  preference: NotificationPreferenceDTO;
}

export class CreateNotificationPreferenceUseCase {
  constructor(
    private notificationPreferencesRepository: NotificationPreferencesRepository,
  ) {}

  async execute(
    request: CreateNotificationPreferenceRequest,
  ): Promise<CreateNotificationPreferenceResponse> {
    const { userId, alertType, channel, isEnabled = true } = request;

    // Validate alert type
    const validAlertTypes: AlertTypeValue[] = [
      'LOW_STOCK',
      'OUT_OF_STOCK',
      'EXPIRING_SOON',
      'EXPIRED',
      'PRICE_CHANGE',
      'REORDER_POINT',
    ];
    if (!validAlertTypes.includes(alertType)) {
      throw new BadRequestError('Invalid alert type');
    }

    // Validate channel
    const validChannels: NotificationChannelValue[] = [
      'IN_APP',
      'EMAIL',
      'SMS',
      'PUSH',
    ];
    if (!validChannels.includes(channel)) {
      throw new BadRequestError('Invalid notification channel');
    }

    // Create preference
    const preference = await this.notificationPreferencesRepository.create({
      userId: new UniqueEntityID(userId),
      alertType,
      channel,
      isEnabled,
    });

    return { preference: notificationPreferenceToDTO(preference) };
  }
}
