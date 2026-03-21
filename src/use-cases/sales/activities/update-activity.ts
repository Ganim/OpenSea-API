import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Activity, ActivityType } from '@/entities/sales/activity';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';

interface UpdateActivityUseCaseRequest {
  id: string;
  tenantId: string;
  type?: ActivityType;
  title?: string;
  description?: string;
  performedAt?: Date;
  dueAt?: Date;
  completedAt?: Date;
  duration?: number;
  outcome?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateActivityUseCaseResponse {
  activity: Activity;
}

export class UpdateActivityUseCase {
  constructor(private activitiesRepository: ActivitiesRepository) {}

  async execute(
    request: UpdateActivityUseCaseRequest,
  ): Promise<UpdateActivityUseCaseResponse> {
    const { id, tenantId, ...rest } = request;

    const activity = await this.activitiesRepository.update({
      id: new UniqueEntityID(id),
      tenantId,
      ...rest,
    });

    if (!activity) {
      throw new ResourceNotFoundError('Activity not found');
    }

    return { activity };
  }
}
