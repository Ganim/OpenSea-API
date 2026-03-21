import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

export type TimelineItem = {
  type: 'activity' | 'timeline_event';
  id: string;
  date: Date;
  title: string;
  activityType?: string;
  eventType?: string;
  metadata?: Record<string, unknown>;
  performedByUserId?: string;
  source?: string;
};

interface GetTimelineUseCaseRequest {
  tenantId: string;
  contactId?: string;
  customerId?: string;
  dealId?: string;
  page: number;
  limit: number;
}

interface GetTimelineUseCaseResponse {
  items: TimelineItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class GetTimelineUseCase {
  constructor(
    private activitiesRepository: ActivitiesRepository,
    private timelineEventsRepository: TimelineEventsRepository,
  ) {}

  async execute(
    request: GetTimelineUseCaseRequest,
  ): Promise<GetTimelineUseCaseResponse> {
    const { tenantId, contactId, customerId, dealId, page, limit } = request;

    // Fetch all matching activities and events (use large limit to get all for merging)
    const [activitiesResult, eventsResult] = await Promise.all([
      this.activitiesRepository.findManyPaginated({
        tenantId,
        contactId,
        customerId,
        dealId,
        page: 1,
        limit: 10000, // Fetch all for merging
        sortOrder: 'desc',
      }),
      this.timelineEventsRepository.findManyPaginated({
        tenantId,
        contactId,
        customerId,
        dealId,
        page: 1,
        limit: 10000, // Fetch all for merging
      }),
    ]);

    // Map activities to timeline items
    const activityItems: TimelineItem[] = activitiesResult.data.map((a) => ({
      type: 'activity' as const,
      id: a.id.toString(),
      date: a.performedAt,
      title: a.title,
      activityType: a.type,
      metadata: a.metadata,
      performedByUserId: a.performedByUserId?.toString(),
    }));

    // Map timeline events to timeline items
    const eventItems: TimelineItem[] = eventsResult.data.map((e) => ({
      type: 'timeline_event' as const,
      id: e.id.toString(),
      date: e.createdAt,
      title: e.title,
      eventType: e.type,
      metadata: e.metadata,
      source: e.source,
    }));

    // Merge and sort by date descending
    const allItems = [...activityItems, ...eventItems].sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );

    // Apply pagination to merged result
    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedItems = allItems.slice(start, start + limit);

    return {
      items: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
