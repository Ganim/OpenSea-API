import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Activity } from '@/entities/sales/activity';
import { TimelineEvent } from '@/entities/sales/timeline-event';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

interface UpdateActivityUseCaseRequest {
  id: string;
  tenantId: string;
  title?: string;
  description?: string;
  status?: string;
  dueDate?: Date | null;
  duration?: number | null;
  userId?: string;
}

interface UpdateActivityUseCaseResponse {
  activity: Activity;
}

export class UpdateActivityUseCase {
  constructor(
    private activitiesRepository: ActivitiesRepository,
    private timelineEventsRepository: TimelineEventsRepository,
  ) {}

  async execute(
    request: UpdateActivityUseCaseRequest,
  ): Promise<UpdateActivityUseCaseResponse> {
    const { id, tenantId, userId, ...updates } = request;

    const activity = await this.activitiesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!activity) {
      throw new ResourceNotFoundError('Activity not found');
    }

    const oldStatus = activity.status;

    if (updates.title !== undefined) activity.title = updates.title;
    if (updates.description !== undefined)
      activity.description = updates.description;
    if (updates.status !== undefined) {
      if (updates.status === 'COMPLETED') {
        activity.complete();
      } else if (updates.status === 'CANCELLED') {
        activity.cancel();
      } else {
        activity.status = updates.status;
      }
    }
    if (updates.dueDate !== undefined) {
      activity.dueDate = updates.dueDate ?? undefined;
    }
    if (updates.duration !== undefined) {
      activity.duration = updates.duration ?? undefined;
    }

    await this.activitiesRepository.save(activity);

    // If activity is linked to a deal and status changed to COMPLETED
    if (
      activity.dealId &&
      updates.status === 'COMPLETED' &&
      oldStatus !== 'COMPLETED'
    ) {
      const event = TimelineEvent.create({
        tenantId: new UniqueEntityID(tenantId),
        dealId: activity.dealId,
        type: 'ACTIVITY_COMPLETED',
        title: `Activity "${activity.title}" (${activity.type}) completed`,
        metadata: {
          activityId: activity.id.toString(),
          activityType: activity.type,
        },
        userId: userId ? new UniqueEntityID(userId) : undefined,
      });
      await this.timelineEventsRepository.create(event);
    }

    return { activity };
  }
}
