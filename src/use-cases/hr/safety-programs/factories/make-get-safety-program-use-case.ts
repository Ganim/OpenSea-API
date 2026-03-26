import { PrismaSafetyProgramsRepository } from '@/repositories/hr/prisma/prisma-safety-programs-repository';
import { GetSafetyProgramUseCase } from '../get-safety-program';

export function makeGetSafetyProgramUseCase() {
  const safetyProgramsRepository = new PrismaSafetyProgramsRepository();
  return new GetSafetyProgramUseCase(safetyProgramsRepository);
}
