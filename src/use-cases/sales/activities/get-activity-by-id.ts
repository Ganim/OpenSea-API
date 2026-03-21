import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Activity } from '@/entities/sales/activity';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';

interface GetActivityByIdUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetActivityByIdUseCaseResponse {
  activity: Activity;
}

export class GetActivityByIdUseCase {
  constructor(private activitiesRepository: ActivitiesRepository) {}

  async execute(
    request: GetActivityByIdUseCaseRequest,
  ): Promise<GetActivityByIdUseCaseResponse> {
    const activity = await this.activitiesRepository.findById(
      new UniqueEntityID(request.id),
      request.tenantId,
    );

    if (!activity) {
      throw new ResourceNotFoundError('Activity not found');
    }

    return { activity };
  }
}
