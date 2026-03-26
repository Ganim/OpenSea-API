import { PrismaSafetyProgramsRepository } from '@/repositories/hr/prisma/prisma-safety-programs-repository';
import { ListSafetyProgramsUseCase } from '../list-safety-programs';

export function makeListSafetyProgramsUseCase() {
  const safetyProgramsRepository = new PrismaSafetyProgramsRepository();
  return new ListSafetyProgramsUseCase(safetyProgramsRepository);
}
