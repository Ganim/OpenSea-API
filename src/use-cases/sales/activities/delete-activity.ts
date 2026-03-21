import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ActivitiesRepository } from '@/repositories/sales/activities-repository';

interface DeleteActivityUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteActivityUseCase {
  constructor(private activitiesRepository: ActivitiesRepository) {}

  async execute(request: DeleteActivityUseCaseRequest): Promise<void> {
    const { id, tenantId } = request;

    const activity = await this.activitiesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!activity) {
      throw new ResourceNotFoundError('Activity not found');
    }

    await this.activitiesRepository.delete(new UniqueEntityID(id), tenantId);
  }
}
