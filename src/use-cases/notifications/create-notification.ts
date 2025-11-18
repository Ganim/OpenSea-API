import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  NotificationChannelValue,
  NotificationPriorityValue,
  NotificationTypeValue,
} from '@/entities/notifications/notification';
import { Notification } from '@/entities/notifications/notification';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

interface CreateNotificationUseCaseRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationTypeValue;
  priority?: NotificationPriorityValue;
  channel: NotificationChannelValue;
  actionUrl?: string;
  actionText?: string;
  entityType?: string;
  entityId?: string;
  scheduledFor?: Date;
}

interface CreateNotificationUseCaseResponse {
  notification: Notification;
}

export class CreateNotificationUseCase {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async execute(
    params: CreateNotificationUseCaseRequest,
  ): Promise<CreateNotificationUseCaseResponse> {
    const notification = await this.notificationsRepository.create({
      userId: new UniqueEntityID(params.userId),
      title: params.title,
      message: params.message,
      type: params.type,
      priority: params.priority ?? 'NORMAL',
      channel: params.channel,
      actionUrl: params.actionUrl,
      actionText: params.actionText,
      entityType: params.entityType,
      entityId: params.entityId,
      scheduledFor: params.scheduledFor,
    });

    return { notification };
  }
}
