import { PrismaWorkstationsRepository } from '@/repositories/production/prisma/prisma-workstations-repository';
import { ListWorkstationsUseCase } from '../list-workstations';

export function makeListWorkstationsUseCase() {
  const workstationsRepository = new PrismaWorkstationsRepository();
  const listWorkstationsUseCase = new ListWorkstationsUseCase(
    workstationsRepository,
  );
  return listWorkstationsUseCase;
}
