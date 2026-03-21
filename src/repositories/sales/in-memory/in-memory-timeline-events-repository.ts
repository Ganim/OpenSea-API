import type { TimelineEvent } from '@/entities/sales/timeline-event';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

export class InMemoryTimelineEventsRepository
  implements TimelineEventsRepository
{
  public items: TimelineEvent[] = [];

  async create(event: TimelineEvent): Promise<void> {
    this.items.push(event);
  }

  async findManyByDeal(
    dealId: string,
    tenantId: string,
  ): Promise<TimelineEvent[]> {
    return this.items
      .filter(
        (e) =>
          e.dealId.toString() === dealId &&
          e.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteByDeal(dealId: string): Promise<void> {
    this.items = this.items.filter(
      (e) => e.dealId.toString() !== dealId,
    );
  }
}
