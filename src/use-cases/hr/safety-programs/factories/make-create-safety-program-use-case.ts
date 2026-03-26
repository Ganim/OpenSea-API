import { PrismaSafetyProgramsRepository } from '@/repositories/hr/prisma/prisma-safety-programs-repository';
import { CreateSafetyProgramUseCase } from '../create-safety-program';

export function makeCreateSafetyProgramUseCase() {
  const safetyProgramsRepository = new PrismaSafetyProgramsRepository();
  return new CreateSafetyProgramUseCase(safetyProgramsRepository);
}
