import { PrismaBonusesRepository } from '@/repositories/hr/prisma/prisma-bonuses-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateBonusUseCase } from '../create-bonus';

export function makeCreateBonusUseCase() {
  const bonusesRepository = new PrismaBonusesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CreateBonusUseCase(bonusesRepository, employeesRepository);
}
