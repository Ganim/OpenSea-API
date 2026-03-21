import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { AnalyticsGoalDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { goalToDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { AnalyticsGoalsRepository } from '@/repositories/sales/analytics-goals-repository';

interface GetGoalProgressUseCaseRequest {
  id: string;
  tenantId: string;
}

interface GetGoalProgressUseCaseResponse {
  goal: AnalyticsGoalDTO;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
  onTrack: boolean;
}

export class GetGoalProgressUseCase {
  constructor(private goalsRepository: AnalyticsGoalsRepository) {}

  async execute(input: GetGoalProgressUseCaseRequest): Promise<GetGoalProgressUseCaseResponse> {
    const goal = await this.goalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!goal) {
      throw new ResourceNotFoundError();
    }

    const now = new Date();
    const start = goal.startDate;
    const end = goal.endDate;
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // On track if progress % >= time elapsed %
    const timeElapsedPercent = (daysElapsed / totalDays) * 100;
    const onTrack = goal.progressPercentage >= timeElapsedPercent;

    return {
      goal: goalToDTO(goal),
      daysRemaining,
      daysElapsed,
      totalDays,
      onTrack,
    };
  }
}
