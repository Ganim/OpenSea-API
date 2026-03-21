import { PrismaAnalyticsGoalsRepository } from '@/repositories/sales/prisma/prisma-analytics-goals-repository';
import { GetGoalProgressUseCase } from '../get-goal-progress';

export function makeGetGoalProgressUseCase() {
  const goalsRepository = new PrismaAnalyticsGoalsRepository();
  return new GetGoalProgressUseCase(goalsRepository);
}
