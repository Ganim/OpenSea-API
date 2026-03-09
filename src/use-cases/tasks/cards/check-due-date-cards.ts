import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CheckDueDateCardsRequest {}

interface CheckDueDateCardsResponse {
  processed: number;
  notified: number;
}

export class CheckDueDateCardsUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private notificationsRepository: NotificationsRepository,
  ) {}

  async execute(
    _request?: CheckDueDateCardsRequest,
  ): Promise<CheckDueDateCardsResponse> {
    const now = new Date();

    // Find all active cards with dueDate <= now (not DONE, not CANCELED, not deleted, not archived)
    const overdueCards = await this.cardsRepository.findCardsDueSoon(now);

    let notified = 0;

    for (const card of overdueCards) {
      const usersToNotify = new Set<string>();

      // Notify the assignee if present
      if (card.assigneeId) {
        usersToNotify.add(card.assigneeId);
      }

      // Notify the reporter
      usersToNotify.add(card.reporterId);

      for (const userId of usersToNotify) {
        // Check if we already sent a notification for this card to this user
        const existing = await this.notificationsRepository.findByUserAndEntity(
          userId,
          'card',
          card.id,
        );

        if (existing) {
          continue;
        }

        await this.notificationsRepository.create({
          userId: new UniqueEntityID(userId),
          title: 'Cartão vencido',
          message: `O cartão "${card.title}" está vencido desde ${this.formatDate(card.dueDate)}.`,
          type: 'WARNING',
          priority: 'HIGH',
          channel: 'IN_APP',
          entityType: 'card',
          entityId: card.id,
          actionUrl: `/tasks?cardId=${card.id}`,
          actionText: 'Ver cartão',
        });

        notified++;
      }
    }

    return {
      processed: overdueCards.length,
      notified,
    };
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
