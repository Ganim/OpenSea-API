import { PrismaBonusesRepository } from '@/repositories/hr/prisma/prisma-bonuses-repository';
import { ListBonusesUseCase } from '../list-bonuses';

export function makeListBonusesUseCase() {
  const bonusesRepository = new PrismaBonusesRepository();
  return new ListBonusesUseCase(bonusesRepository);
}
