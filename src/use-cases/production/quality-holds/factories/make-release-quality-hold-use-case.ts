import { PrismaQualityHoldsRepository } from '@/repositories/production/prisma/prisma-quality-holds-repository';
import { ReleaseQualityHoldUseCase } from '../release-quality-hold';

export function makeReleaseQualityHoldUseCase() {
  const qualityHoldsRepository = new PrismaQualityHoldsRepository();
  return new ReleaseQualityHoldUseCase(qualityHoldsRepository);
}
