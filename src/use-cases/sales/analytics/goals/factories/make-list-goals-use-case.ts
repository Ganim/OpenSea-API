import { PrismaAnalyticsGoalsRepository } from '@/repositories/sales/prisma/prisma-analytics-goals-repository';
import { ListGoalsUseCase } from '../list-goals';

export function makeListGoalsUseCase() {
  const goalsRepository = new PrismaAnalyticsGoalsRepository();
  return new ListGoalsUseCase(goalsRepository);
}
