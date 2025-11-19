import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Notification } from '@/entities/notifications/notification';
import type {
    CreateNotificationSchema,
    ListNotificationsFilter,
    NotificationsRepository,
} from '../notifications-repository';

export class InMemoryNotificationsRepository
  implements NotificationsRepository
{
  public items: Notification[] = [];

  async create(data: CreateNotificationSchema): Promise<Notification> {
    const notification = Notification.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority ?? 'NORMAL',
      channel: data.channel,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      entityType: data.entityType,
      entityId: data.entityId,
      scheduledFor: data.scheduledFor,
      isRead: false,
      isSent: false,
    });

    this.items.push(notification);
    return notification;
  }

  async findById(id: UniqueEntityID): Promise<Notification | null> {
    const found = this.items.find((n) => n.id.equals(id));
    return found ?? null;
  }

  async list(
    filter: ListNotificationsFilter,
  ): Promise<{ data: Notification[]; total: number }> {
    let result = this.items.filter(
      (n) => n.userId.toString() === filter.userId.toString() && !n.deletedAt,
    );

    if (typeof filter.isRead === 'boolean') {
      result = result.filter((n) => n.isRead === filter.isRead);
    }
    if (filter.type) {
      result = result.filter((n) => n.type === filter.type);
    }
    if (filter.channel) {
      result = result.filter((n) => n.channel === filter.channel);
    }
    if (filter.priority) {
      result = result.filter((n) => n.priority === filter.priority);
    }
    if (filter.startDate || filter.endDate) {
      result = result.filter((n) => {
        const d = n.createdAt.getTime();
        const after = filter.startDate ? d >= filter.startDate.getTime() : true;
        const before = filter.endDate ? d <= filter.endDate.getTime() : true;
        return after && before;
      });
    }

    // Order by createdAt desc (as Prisma impl)
    result = result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const total = result.length;
    const start = (page - 1) * limit;
    const data = result.slice(start, start + limit);

    return { data, total };
  }

  async listScheduledPending(now: Date, limit: number = 50): Promise<Notification[]> {
    const candidates = this.items
      .filter(
        (n) =>
          !n.deletedAt &&
          !n.isSent &&
          n.scheduledFor &&
          n.scheduledFor.getTime() <= now.getTime(),
      )
      .sort((a, b) => (a.scheduledFor!.getTime() - b.scheduledFor!.getTime()));
    return candidates.slice(0, limit);
  }

  async markAsRead(id: UniqueEntityID): Promise<void> {
    const n = await this.findById(id);
    if (n) n.markRead();
  }

  async markAllAsRead(userId: UniqueEntityID): Promise<number> {
    let count = 0;
    for (const n of this.items) {
      if (n.userId.equals(userId) && !n.isRead && !n.deletedAt) {
        n.markRead();
        count++;
      }
    }
    return count;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const n = await this.findById(id);
    if (n) n.delete();
  }

  async save(notification: Notification): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(notification.id));
    if (index >= 0) this.items[index] = notification;
    else this.items.push(notification);
  }
}
