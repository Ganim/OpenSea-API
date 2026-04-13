import { PrismaWorkstationTypesRepository } from '@/repositories/production/prisma/prisma-workstation-types-repository';
import { ListWorkstationTypesUseCase } from '../list-workstation-types';

export function makeListWorkstationTypesUseCase() {
  const workstationTypesRepository = new PrismaWorkstationTypesRepository();
  const listWorkstationTypesUseCase = new ListWorkstationTypesUseCase(
    workstationTypesRepository,
  );
  return listWorkstationTypesUseCase;
}
