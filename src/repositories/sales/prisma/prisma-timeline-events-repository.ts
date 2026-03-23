import type { TimelineEvent } from '@/entities/sales/timeline-event';
import { prisma } from '@/lib/prisma';
import { timelineEventPrismaToDomain } from '@/mappers/sales/timeline-event/timeline-event-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyTimelineEventsPaginatedParams,
  TimelineEventsRepository,
} from '../timeline-events-repository';
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

    return items.map((e) =>
      timelineEventPrismaToDomain(e as unknown as Record<string, unknown>),
    );
  }

  async findManyPaginated(
    params: FindManyTimelineEventsPaginatedParams,
  ): Promise<PaginatedResult<TimelineEvent>> {
    const where: Record<string, unknown> = { tenantId: params.tenantId };
    if (params.dealId) where.dealId = params.dealId;

    const [items, total] = await Promise.all([
      prisma.crmTimelineEvent.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.crmTimelineEvent.count({ where: where as never }),
    ]);

    return {
      data: items.map((e) =>
        timelineEventPrismaToDomain(e as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async deleteByDeal(dealId: string): Promise<void> {
    await prisma.crmTimelineEvent.deleteMany({
      where: { dealId },
    });
  }
}
