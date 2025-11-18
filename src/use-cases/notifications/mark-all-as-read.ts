import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

interface MarkAllAsReadUseCaseResponse {
  count: number;
}

export class MarkAllAsReadUseCase {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async execute(params: { userId: string }): Promise<MarkAllAsReadUseCaseResponse> {
    const count = await this.notificationsRepository.markAllAsRead(
      new UniqueEntityID(params.userId),
    );
    return { count };
  }
}
