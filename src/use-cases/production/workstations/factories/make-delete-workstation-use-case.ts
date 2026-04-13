import { PrismaWorkstationsRepository } from '@/repositories/production/prisma/prisma-workstations-repository';
import { DeleteWorkstationUseCase } from '../delete-workstation';

export function makeDeleteWorkstationUseCase() {
  const workstationsRepository = new PrismaWorkstationsRepository();
  const deleteWorkstationUseCase = new DeleteWorkstationUseCase(
    workstationsRepository,
  );
  return deleteWorkstationUseCase;
}
