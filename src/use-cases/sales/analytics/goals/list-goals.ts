import type { AnalyticsGoalDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { goalToDTO } from '@/mappers/sales/analytics/goal-to-dto';
import { AnalyticsGoalsRepository } from '@/repositories/sales/analytics-goals-repository';

interface ListGoalsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: string;
  type?: string;
  scope?: string;
  userId?: string;
}

interface ListGoalsUseCaseResponse {
  goals: AnalyticsGoalDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListGoalsUseCase {
  constructor(private goalsRepository: AnalyticsGoalsRepository) {}

  async execute(
    input: ListGoalsUseCaseRequest,
  ): Promise<ListGoalsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const filters = {
      status: input.status,
      type: input.type,
      scope: input.scope,
      userId: input.userId,
    };

    const [goals, total] = await Promise.all([
      this.goalsRepository.findMany(page, perPage, input.tenantId, filters),
      this.goalsRepository.countMany(input.tenantId, filters),
    ]);

    return {
      goals: goals.map(goalToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
