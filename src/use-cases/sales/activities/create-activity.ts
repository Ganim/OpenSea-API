import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { Activity, ActivityType } from '@/entities/sales/activity';
import { ACTIVITY_TYPES } from '@/entities/sales/activity';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';

interface CreateActivityUseCaseRequest {
  tenantId: string;
  type: string;
  contactId?: string;
  customerId?: string;
  dealId?: string;
  title: string;
  description?: string;
  performedByUserId?: string;
  performedAt?: Date;
  dueAt?: Date;
  completedAt?: Date;
  duration?: number;
  outcome?: string;
  metadata?: Record<string, unknown>;
}

interface CreateActivityUseCaseResponse {
  activity: Activity;
}

export class CreateActivityUseCase {
  constructor(private activitiesRepository: ActivitiesRepository) {}

  async execute(
    request: CreateActivityUseCaseRequest,
  ): Promise<CreateActivityUseCaseResponse> {
    const { tenantId, type, title } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Title is required');
    }

    if (!ACTIVITY_TYPES.includes(type as ActivityType)) {
      throw new BadRequestError(
        `Invalid activity type: "${type}". Valid values: ${ACTIVITY_TYPES.join(', ')}`,
      );
    }

    const activity = await this.activitiesRepository.create({
      tenantId,
      type: type as ActivityType,
      contactId: request.contactId,
      customerId: request.customerId,
      dealId: request.dealId,
      title: title.trim(),
      description: request.description,
      performedByUserId: request.performedByUserId,
      performedAt: request.performedAt,
      dueAt: request.dueAt,
      completedAt: request.completedAt,
      duration: request.duration,
      outcome: request.outcome,
      metadata: request.metadata,
    });

    return { activity };
  }
}
