import { PrismaOvertimeRepository } from '@/repositories/hr/prisma/prisma-overtime-repository';
import { ListOvertimeUseCase } from '../list-overtime';

export function makeListOvertimeUseCase(): ListOvertimeUseCase {
  const overtimeRepository = new PrismaOvertimeRepository();
  const useCase = new ListOvertimeUseCase(overtimeRepository);

  return useCase;
}
