import { PrismaWorkstationTypesRepository } from '@/repositories/production/prisma/prisma-workstation-types-repository';
import { CreateWorkstationTypeUseCase } from '../create-workstation-type';

export function makeCreateWorkstationTypeUseCase() {
  const workstationTypesRepository = new PrismaWorkstationTypesRepository();
  const createWorkstationTypeUseCase = new CreateWorkstationTypeUseCase(
    workstationTypesRepository,
  );
  return createWorkstationTypeUseCase;
}
