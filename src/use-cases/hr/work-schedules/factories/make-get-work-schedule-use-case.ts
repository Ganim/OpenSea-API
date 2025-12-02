import { PrismaWorkSchedulesRepository } from '@/repositories/hr/prisma/prisma-work-schedules-repository';
import { GetWorkScheduleUseCase } from '../get-work-schedule';

export function makeGetWorkScheduleUseCase(): GetWorkScheduleUseCase {
  const workSchedulesRepository = new PrismaWorkSchedulesRepository();
  const useCase = new GetWorkScheduleUseCase(workSchedulesRepository);

  return useCase;
}
