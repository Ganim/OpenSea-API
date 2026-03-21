import type { TimelineEvent } from '@/entities/sales/timeline-event';
import { prisma } from '@/lib/prisma';
import { timelineEventPrismaToDomain } from '@/mappers/sales/timeline-event/timeline-event-prisma-to-domain';
import type { TimelineEventsRepository } from '../timeline-events-repository';
import type { TimelineEventType } from '@prisma/generated/client.js';

export class PrismaTimelineEventsRepository
  implements TimelineEventsRepository
{
  async create(event: TimelineEvent): Promise<void> {
    await prisma.crmTimelineEvent.create({
      data: {
        id: event.id.toString(),
        tenantId: event.tenantId.toString(),
        dealId: event.dealId.toString(),
        type: event.type as TimelineEventType,
        title: event.title,
        metadata: (event.metadata ?? undefined) as never,
        userId: event.userId?.toString() ?? null,
        createdAt: event.createdAt,
      },
    });
  }

  async findManyByDeal(
    dealId: string,
    tenantId: string,
  ): Promise<TimelineEvent[]> {
    const items = await prisma.crmTimelineEvent.findMany({
      where: {
        dealId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return items.map((e: any) =>
      timelineEventPrismaToDomain(e as unknown as Record<string, unknown>),
    );
  }

  async deleteByDeal(dealId: string): Promise<void> {
    await prisma.crmTimelineEvent.deleteMany({
      where: { dealId },
    });
  }
}
