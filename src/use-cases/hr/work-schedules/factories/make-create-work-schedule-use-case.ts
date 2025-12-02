import { PrismaWorkSchedulesRepository } from '@/repositories/hr/prisma/prisma-work-schedules-repository';
import { CreateWorkScheduleUseCase } from '../create-work-schedule';

export function makeCreateWorkScheduleUseCase(): CreateWorkScheduleUseCase {
  const workSchedulesRepository = new PrismaWorkSchedulesRepository();
  const useCase = new CreateWorkScheduleUseCase(workSchedulesRepository);

  return useCase;
}
