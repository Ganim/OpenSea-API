import { PrismaQualityHoldsRepository } from '@/repositories/production/prisma/prisma-quality-holds-repository';
import { CreateQualityHoldUseCase } from '../create-quality-hold';

export function makeCreateQualityHoldUseCase() {
  const qualityHoldsRepository = new PrismaQualityHoldsRepository();
  return new CreateQualityHoldUseCase(qualityHoldsRepository);
}
