import { PrismaSafetyProgramsRepository } from '@/repositories/hr/prisma/prisma-safety-programs-repository';
import { DeleteSafetyProgramUseCase } from '../delete-safety-program';

export function makeDeleteSafetyProgramUseCase() {
  const safetyProgramsRepository = new PrismaSafetyProgramsRepository();
  return new DeleteSafetyProgramUseCase(safetyProgramsRepository);
}
