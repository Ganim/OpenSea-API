import { PrismaQualityHoldsRepository } from '@/repositories/production/prisma/prisma-quality-holds-repository';
import { ListQualityHoldsUseCase } from '../list-quality-holds';

export function makeListQualityHoldsUseCase() {
  const qualityHoldsRepository = new PrismaQualityHoldsRepository();
  return new ListQualityHoldsUseCase(qualityHoldsRepository);
}
