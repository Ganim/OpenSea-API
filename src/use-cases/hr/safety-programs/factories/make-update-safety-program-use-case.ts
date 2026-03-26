import { PrismaSafetyProgramsRepository } from '@/repositories/hr/prisma/prisma-safety-programs-repository';
import { UpdateSafetyProgramUseCase } from '../update-safety-program';

export function makeUpdateSafetyProgramUseCase() {
  const safetyProgramsRepository = new PrismaSafetyProgramsRepository();
  return new UpdateSafetyProgramUseCase(safetyProgramsRepository);
}
