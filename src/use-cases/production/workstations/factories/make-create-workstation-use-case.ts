import { PrismaWorkCentersRepository } from '@/repositories/production/prisma/prisma-work-centers-repository';
import { PrismaWorkstationsRepository } from '@/repositories/production/prisma/prisma-workstations-repository';
import { PrismaWorkstationTypesRepository } from '@/repositories/production/prisma/prisma-workstation-types-repository';
import { CreateWorkstationUseCase } from '../create-workstation';

export function makeCreateWorkstationUseCase() {
  const workstationsRepository = new PrismaWorkstationsRepository();
  const workstationTypesRepository = new PrismaWorkstationTypesRepository();
  const workCentersRepository = new PrismaWorkCentersRepository();
  const createWorkstationUseCase = new CreateWorkstationUseCase(
    workstationsRepository,
    workstationTypesRepository,
    workCentersRepository,
  );
  return createWorkstationUseCase;
}
