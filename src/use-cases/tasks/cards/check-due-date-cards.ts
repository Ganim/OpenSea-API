import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  NotificationTypeValue,
  NotificationPriorityValue,
} from '@/entities/notifications/notification';
import type { CardsRepository, OverdueCardRecord } from '@/repositories/tasks/cards-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CheckDueDateCardsRequest {}

interface CheckDueDateCardsResponse {
  processed: number;
  notified: number;
}

type NotificationLevel = 'OVERDUE' | 'DUE_1H' | 'DUE_24H';

export class CheckDueDateCardsUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private notificationsRepository: NotificationsRepository,
  ) {}

  async execute(
    _request?: CheckDueDateCardsRequest,
  ): Promise<CheckDueDateCardsResponse> {
    const now = new Date();
    let totalProcessed = 0;
    let totalNotified = 0;

    // 1. Overdue cards (dueDate <= now)
    const overdueCards = await this.cardsRepository.findCardsDueSoon(now);
    totalProcessed += overdueCards.length;

    for (const card of overdueCards) {
      totalNotified += await this.notifyCardUsers(card, 'OVERDUE');
    }

    // 2. Cards due within 1 hour (now < dueDate <= now + 1h)
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const dueSoon1h = await this.cardsRepository.findCardsByDueDateRange(
      new Date(now.getTime() + 1), // exclude already overdue
      oneHourFromNow,
    );
    totalProcessed += dueSoon1h.length;

    for (const card of dueSoon1h) {
      totalNotified += await this.notifyCardUsers(card, 'DUE_1H');
    }

    // 3. Cards due within 24 hours (now + 1h < dueDate <= now + 24h)
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueSoon24h = await this.cardsRepository.findCardsByDueDateRange(
      new Date(oneHourFromNow.getTime() + 1), // exclude 1h window
      twentyFourHoursFromNow,
    );
    totalProcessed += dueSoon24h.length;

    for (const card of dueSoon24h) {
      totalNotified += await this.notifyCardUsers(card, 'DUE_24H');
    }

    return {
      processed: totalProcessed,
      notified: totalNotified,
    };
  }

  private async notifyCardUsers(
    card: OverdueCardRecord,
    level: NotificationLevel,
  ): Promise<number> {
    const usersToNotify = new Set<string>();

    if (card.assigneeId) {
      usersToNotify.add(card.assigneeId);
    }
    usersToNotify.add(card.reporterId);

    let notified = 0;

    for (const userId of usersToNotify) {
      // entityId includes the level to allow separate notifications per time window
      const entityId = `${card.id}:${level}`;

      const existing = await this.notificationsRepository.findByUserAndEntity(
        userId,
        'card',
        entityId,
      );

      if (existing) {
        continue;
      }

      const { title, message, type, priority } = this.buildNotification(card, level);

      await this.notificationsRepository.create({
        userId: new UniqueEntityID(userId),
        title,
        message,
        type,
        priority,
        channel: 'IN_APP',
        entityType: 'card',
        entityId,
        actionUrl: `/tasks?cardId=${card.id}`,
        actionText: 'Ver cartão',
      });

      notified++;
    }

    return notified;
  }

  private buildNotification(
    card: OverdueCardRecord,
    level: NotificationLevel,
  ): { title: string; message: string; type: NotificationTypeValue; priority: NotificationPriorityValue } {
    switch (level) {
      case 'DUE_24H':
        return {
          title: 'Cartão vence em breve',
          message: `O cartão "${card.title}" vence em menos de 24 horas.`,
          type: 'INFO',
          priority: 'NORMAL',
        };
      case 'DUE_1H':
        return {
          title: 'Cartão vence em 1 hora',
          message: `O cartão "${card.title}" vence em menos de 1 hora!`,
          type: 'WARNING',
          priority: 'HIGH',
        };
      case 'OVERDUE':
        return {
          title: 'Cartão vencido',
          message: `O cartão "${card.title}" está vencido desde ${this.formatDate(card.dueDate)}.`,
          type: 'WARNING',
          priority: 'HIGH',
        };
    }
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
