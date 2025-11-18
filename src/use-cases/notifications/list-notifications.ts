import type { Notification } from '@/entities/notifications/notification';
import type {
  ListNotificationsFilter,
  NotificationsRepository,
} from '@/repositories/notifications/notifications-repository';

interface ListNotificationsUseCaseRequest {
  userId: string;
  isRead?: boolean;
  type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'REMINDER';
  channel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface ListNotificationsUseCaseResponse {
  data: Notification[];
  total: number;
}

export class ListNotificationsByUserIdUseCase {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async execute(
    params: ListNotificationsUseCaseRequest,
  ): Promise<ListNotificationsUseCaseResponse> {
    const filter: ListNotificationsFilter = {
      userId: { toString: () => params.userId } as any, // será convertido no repo
      isRead: params.isRead,
      type: params.type,
      channel: params.channel,
      priority: params.priority,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page,
      limit: params.limit,
    };

    const result = await this.notificationsRepository.list(filter);
    return result;
  }
}
