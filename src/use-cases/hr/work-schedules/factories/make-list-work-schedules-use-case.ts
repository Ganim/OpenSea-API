import { PrismaWorkSchedulesRepository } from '@/repositories/hr/prisma/prisma-work-schedules-repository';
import { ListWorkSchedulesUseCase } from '../list-work-schedules';

export function makeListWorkSchedulesUseCase(): ListWorkSchedulesUseCase {
  const workSchedulesRepository = new PrismaWorkSchedulesRepository();
  const useCase = new ListWorkSchedulesUseCase(workSchedulesRepository);

  return useCase;
}
