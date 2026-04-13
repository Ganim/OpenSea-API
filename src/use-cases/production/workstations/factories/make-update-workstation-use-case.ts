import { PrismaWorkCentersRepository } from '@/repositories/production/prisma/prisma-work-centers-repository';
import { PrismaWorkstationsRepository } from '@/repositories/production/prisma/prisma-workstations-repository';
import { PrismaWorkstationTypesRepository } from '@/repositories/production/prisma/prisma-workstation-types-repository';
import { UpdateWorkstationUseCase } from '../update-workstation';

export function makeUpdateWorkstationUseCase() {
  const workstationsRepository = new PrismaWorkstationsRepository();
  const workstationTypesRepository = new PrismaWorkstationTypesRepository();
  const workCentersRepository = new PrismaWorkCentersRepository();
  const updateWorkstationUseCase = new UpdateWorkstationUseCase(
    workstationsRepository,
    workstationTypesRepository,
    workCentersRepository,
  );
  return updateWorkstationUseCase;
}
