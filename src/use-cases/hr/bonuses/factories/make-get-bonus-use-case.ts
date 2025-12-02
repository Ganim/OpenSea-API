import { PrismaBonusesRepository } from '@/repositories/hr/prisma/prisma-bonuses-repository';
import { GetBonusUseCase } from '../get-bonus';

export function makeGetBonusUseCase() {
  const bonusesRepository = new PrismaBonusesRepository();
  return new GetBonusUseCase(bonusesRepository);
}
