import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AnalyticsGoalDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { goalToDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { AnalyticsGoalsRepository } from '@/repositories/sales/analytics-goals-repository';

interface UpdateGoalUseCaseRequest {
  id: string;
  tenantId: string;
  name?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface UpdateGoalUseCaseResponse {
  goal: AnalyticsGoalDTO;
}

export class UpdateGoalUseCase {
  constructor(private goalsRepository: AnalyticsGoalsRepository) {}

  async execute(input: UpdateGoalUseCaseRequest): Promise<UpdateGoalUseCaseResponse> {
    const existing = await this.goalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError();
    }

    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new BadRequestError('Goal name cannot be empty.');
    }

    if (input.targetValue !== undefined && input.targetValue <= 0) {
      throw new BadRequestError('Target value must be greater than zero.');
    }

    const goal = await this.goalsRepository.update({
      id: new UniqueEntityID(input.id),
      tenantId: input.tenantId,
      name: input.name?.trim(),
      targetValue: input.targetValue,
      currentValue: input.currentValue,
      unit: input.unit,
      status: input.status,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    });

    if (!goal) {
      throw new ResourceNotFoundError();
    }

    return { goal: goalToDTO(goal) };
  }
}
