import { PrismaWorkSchedulesRepository } from '@/repositories/hr/prisma/prisma-work-schedules-repository';
import { UpdateWorkScheduleUseCase } from '../update-work-schedule';

export function makeUpdateWorkScheduleUseCase(): UpdateWorkScheduleUseCase {
  const workSchedulesRepository = new PrismaWorkSchedulesRepository();
  const useCase = new UpdateWorkScheduleUseCase(workSchedulesRepository);

  return useCase;
}
