import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsGoalsRepository } from '@/repositories/sales/analytics-goals-repository';

interface DeleteGoalUseCaseRequest {
  id: string;
  tenantId: string;
}

export class DeleteGoalUseCase {
  constructor(private goalsRepository: AnalyticsGoalsRepository) {}

  async execute(input: DeleteGoalUseCaseRequest): Promise<void> {
    const goal = await this.goalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!goal) {
      throw new ResourceNotFoundError();
    }

    await this.goalsRepository.delete(new UniqueEntityID(input.id), input.tenantId);
  }
}
