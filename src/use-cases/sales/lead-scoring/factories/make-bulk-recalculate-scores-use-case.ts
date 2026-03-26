import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaLeadScoringRulesRepository } from '@/repositories/sales/prisma/prisma-lead-scoring-rules-repository';
import { PrismaLeadScoresRepository } from '@/repositories/sales/prisma/prisma-lead-scores-repository';
import { BulkRecalculateScoresUseCase } from '../bulk-recalculate-scores';

export function makeBulkRecalculateScoresUseCase() {
  const leadScoringRulesRepository = new PrismaLeadScoringRulesRepository();
  const leadScoresRepository = new PrismaLeadScoresRepository();
  const customersRepository = new PrismaCustomersRepository();
  return new BulkRecalculateScoresUseCase(
    leadScoringRulesRepository,
    leadScoresRepository,
    customersRepository,
  );
}
