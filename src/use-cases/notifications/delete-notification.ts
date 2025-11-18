import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

export class DeleteNotificationUseCase {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async execute(params: { notificationId: string }): Promise<void> {
    await this.notificationsRepository.delete(
      new UniqueEntityID(params.notificationId),
    );
  }
}
