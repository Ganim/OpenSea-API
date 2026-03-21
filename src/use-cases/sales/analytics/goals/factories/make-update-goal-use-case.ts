import { PrismaAnalyticsGoalsRepository } from '@/repositories/sales/prisma/prisma-analytics-goals-repository';
import { UpdateGoalUseCase } from '../update-goal';

export function makeUpdateGoalUseCase() {
  const goalsRepository = new PrismaAnalyticsGoalsRepository();
  return new UpdateGoalUseCase(goalsRepository);
}
