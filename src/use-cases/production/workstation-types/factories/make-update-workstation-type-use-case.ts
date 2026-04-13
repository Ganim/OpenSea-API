import { PrismaWorkstationTypesRepository } from '@/repositories/production/prisma/prisma-workstation-types-repository';
import { UpdateWorkstationTypeUseCase } from '../update-workstation-type';

export function makeUpdateWorkstationTypeUseCase() {
  const workstationTypesRepository = new PrismaWorkstationTypesRepository();
  const updateWorkstationTypeUseCase = new UpdateWorkstationTypeUseCase(
    workstationTypesRepository,
  );
  return updateWorkstationTypeUseCase;
}
