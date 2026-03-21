import { PrismaAnalyticsGoalsRepository } from '@/repositories/sales/prisma/prisma-analytics-goals-repository';
import { CreateGoalUseCase } from '../create-goal';

export function makeCreateGoalUseCase() {
  const goalsRepository = new PrismaAnalyticsGoalsRepository();
  return new CreateGoalUseCase(goalsRepository);
}
