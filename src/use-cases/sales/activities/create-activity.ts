import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Activity } from '@/entities/sales/activity';
import { TimelineEvent } from '@/entities/sales/timeline-event';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

const VALID_ACTIVITY_TYPES = [
  'CALL',
  'EMAIL',
  'MEETING',
  'TASK',
  'NOTE',
  'WHATSAPP',
  'VISIT',
  'PROPOSAL',
  'FOLLOW_UP',
];

interface CreateActivityUseCaseRequest {
  tenantId: string;
  dealId?: string;
  contactId?: string;
  type: string;
  title: string;
  description?: string;
  dueDate?: Date;
  duration?: number;
  userId: string;
}

interface CreateActivityUseCaseResponse {
  activity: Activity;
}

export class CreateActivityUseCase {
  constructor(
    private activitiesRepository: ActivitiesRepository,
    private timelineEventsRepository: TimelineEventsRepository,
  ) {}

  async execute(
    request: CreateActivityUseCaseRequest,
  ): Promise<CreateActivityUseCaseResponse> {
    const { tenantId, type, title, userId } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    if (!VALID_ACTIVITY_TYPES.includes(type)) {
      throw new BadRequestError(
        `Invalid activity type: "${type}". Valid values: ${VALID_ACTIVITY_TYPES.join(', ')}`,
      );
    }

    const activity = Activity.create({
      tenantId: new UniqueEntityID(tenantId),
      dealId: request.dealId ? new UniqueEntityID(request.dealId) : undefined,
      contactId: request.contactId
        ? new UniqueEntityID(request.contactId)
        : undefined,
      type,
      title: title.trim(),
      description: request.description,
      dueDate: request.dueDate,
      duration: request.duration,
      userId: new UniqueEntityID(userId),
    });

    await this.activitiesRepository.create(activity);

    // If activity is linked to a deal, create timeline event
    if (request.dealId) {
      const event = TimelineEvent.create({
        tenantId: new UniqueEntityID(tenantId),
        dealId: new UniqueEntityID(request.dealId),
        type: 'ACTIVITY_CREATED',
        title: `Activity "${activity.title}" (${type}) created`,
        metadata: {
          activityId: activity.id.toString(),
          activityType: type,
        },
        userId: new UniqueEntityID(userId),
      });
      await this.timelineEventsRepository.create(event);
    }

    return { activity };
  }
}
