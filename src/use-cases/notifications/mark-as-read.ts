import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

export class MarkAsReadUseCase {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async execute(params: {
    notificationId: string;
    userId: string;
  }): Promise<void> {
    const affected = await this.notificationsRepository.markAsRead(
      new UniqueEntityID(params.notificationId),
      new UniqueEntityID(params.userId),
    );

    if (!affected) {
      throw new ResourceNotFoundError('Notification not found');
    }
  }
}
