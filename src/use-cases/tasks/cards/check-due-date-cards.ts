import { NotificationPriority } from '@/modules/notifications/public';
import type {
  CardsRepository,
  OverdueCardRecord,
} from '@/repositories/tasks/cards-repository';
import type { ModuleNotifier } from '@/use-cases/shared/helpers/module-notifier';

export type TaskDueDateNotificationCategory =
  | 'tasks.due_soon'
  | 'tasks.due_today'
  | 'tasks.overdue';

interface CheckDueDateCardsRequest {
  /** Tenant to scope the notifications to. Required for dispatch. */
  tenantId: string;
}

interface CheckDueDateCardsResponse {
  processed: number;
  notified: number;
}

type NotificationLevel = 'OVERDUE' | 'DUE_1H' | 'DUE_24H';

const LEVEL_TO_CATEGORY: Record<
  NotificationLevel,
  TaskDueDateNotificationCategory
> = {
  OVERDUE: 'tasks.overdue',
  DUE_1H: 'tasks.due_today',
  DUE_24H: 'tasks.due_soon',
};

export class CheckDueDateCardsUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private notifier: ModuleNotifier<TaskDueDateNotificationCategory>,
  ) {}

  async execute(
    request: CheckDueDateCardsRequest,
  ): Promise<CheckDueDateCardsResponse> {
    const now = new Date();
    let totalProcessed = 0;
    let totalNotified = 0;

    const overdueCards = await this.cardsRepository.findCardsDueSoon(now);
    totalProcessed += overdueCards.length;

    for (const card of overdueCards) {
      totalNotified += await this.notifyCardUsers(
        request.tenantId,
        card,
        'OVERDUE',
      );
    }

    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const dueSoon1h = await this.cardsRepository.findCardsByDueDateRange(
      new Date(now.getTime() + 1),
      oneHourFromNow,
    );
    totalProcessed += dueSoon1h.length;

    for (const card of dueSoon1h) {
      totalNotified += await this.notifyCardUsers(
        request.tenantId,
        card,
        'DUE_1H',
      );
    }

    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );
    const dueSoon24h = await this.cardsRepository.findCardsByDueDateRange(
      new Date(oneHourFromNow.getTime() + 1),
      twentyFourHoursFromNow,
    );
    totalProcessed += dueSoon24h.length;

    for (const card of dueSoon24h) {
      totalNotified += await this.notifyCardUsers(
        request.tenantId,
        card,
        'DUE_24H',
      );
    }

    return {
      processed: totalProcessed,
      notified: totalNotified,
    };
  }

  private async notifyCardUsers(
    tenantId: string,
    card: OverdueCardRecord,
    level: NotificationLevel,
  ): Promise<number> {
    const usersToNotify = new Set<string>();

    if (card.assigneeId) {
      usersToNotify.add(card.assigneeId);
    }
    usersToNotify.add(card.reporterId);

    let notified = 0;
    const { title, body, priority } = this.buildNotification(card, level);
    const category = LEVEL_TO_CATEGORY[level];

    for (const userId of usersToNotify) {
      await this.notifier.dispatch({
        category,
        tenantId,
        recipientUserId: userId,
        title,
        body,
        priority,
        entityType: 'card',
        entityId: card.id,
        // dedupeSuffix ties dispatch idempotency to (level, userId) so each
        // window fires at most once per user — same semantics as the
        // previous findByUserAndEntity lookup.
        dedupeSuffix: `${level}:${userId}`,
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
  ): {
    title: string;
    body: string;
    priority: NotificationPriority;
  } {
    switch (level) {
      case 'DUE_24H':
        return {
          title: 'Cartão vence em breve',
          body: `O cartão "${card.title}" vence em menos de 24 horas.`,
          priority: NotificationPriority.NORMAL,
        };
      case 'DUE_1H':
        return {
          title: 'Cartão vence em 1 hora',
          body: `O cartão "${card.title}" vence em menos de 1 hora!`,
          priority: NotificationPriority.HIGH,
        };
      case 'OVERDUE':
        return {
          title: 'Cartão vencido',
          body: `O cartão "${card.title}" está vencido desde ${this.formatDate(card.dueDate)}.`,
          priority: NotificationPriority.HIGH,
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
