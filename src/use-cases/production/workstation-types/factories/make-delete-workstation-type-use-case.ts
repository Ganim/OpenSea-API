import { PrismaWorkstationTypesRepository } from '@/repositories/production/prisma/prisma-workstation-types-repository';
import { DeleteWorkstationTypeUseCase } from '../delete-workstation-type';

export function makeDeleteWorkstationTypeUseCase() {
  const workstationTypesRepository = new PrismaWorkstationTypesRepository();
  const deleteWorkstationTypeUseCase = new DeleteWorkstationTypeUseCase(
    workstationTypesRepository,
  );
  return deleteWorkstationTypeUseCase;
}
