import { PrismaAnalyticsGoalsRepository } from '@/repositories/sales/prisma/prisma-analytics-goals-repository';
import { DeleteGoalUseCase } from '../delete-goal';

export function makeDeleteGoalUseCase() {
  const goalsRepository = new PrismaAnalyticsGoalsRepository();
  return new DeleteGoalUseCase(goalsRepository);
}
