import { PrismaWorkstationTypesRepository } from '@/repositories/production/prisma/prisma-workstation-types-repository';
import { GetWorkstationTypeByIdUseCase } from '../get-workstation-type-by-id';

export function makeGetWorkstationTypeByIdUseCase() {
  const workstationTypesRepository = new PrismaWorkstationTypesRepository();
  const getWorkstationTypeByIdUseCase = new GetWorkstationTypeByIdUseCase(
    workstationTypesRepository,
  );
  return getWorkstationTypeByIdUseCase;
}
