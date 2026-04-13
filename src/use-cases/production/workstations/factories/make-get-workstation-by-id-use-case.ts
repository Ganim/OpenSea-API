import { PrismaWorkstationsRepository } from '@/repositories/production/prisma/prisma-workstations-repository';
import { GetWorkstationByIdUseCase } from '../get-workstation-by-id';

export function makeGetWorkstationByIdUseCase() {
  const workstationsRepository = new PrismaWorkstationsRepository();
  const getWorkstationByIdUseCase = new GetWorkstationByIdUseCase(
    workstationsRepository,
  );
  return getWorkstationByIdUseCase;
}
