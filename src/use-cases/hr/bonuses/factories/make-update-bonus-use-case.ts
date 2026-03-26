import { PrismaBonusesRepository } from '@/repositories/hr/prisma/prisma-bonuses-repository';
import { UpdateBonusUseCase } from '../update-bonus';

export function makeUpdateBonusUseCase() {
  const bonusesRepository = new PrismaBonusesRepository();
  return new UpdateBonusUseCase(bonusesRepository);
}
