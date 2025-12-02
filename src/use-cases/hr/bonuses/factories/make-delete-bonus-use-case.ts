import { PrismaBonusesRepository } from '@/repositories/hr/prisma/prisma-bonuses-repository';
import { DeleteBonusUseCase } from '../delete-bonus';

export function makeDeleteBonusUseCase() {
  const bonusesRepository = new PrismaBonusesRepository();
  return new DeleteBonusUseCase(bonusesRepository);
}
