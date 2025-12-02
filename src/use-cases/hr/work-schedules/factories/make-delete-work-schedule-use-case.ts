import { PrismaWorkSchedulesRepository } from '@/repositories/hr/prisma/prisma-work-schedules-repository';
import { DeleteWorkScheduleUseCase } from '../delete-work-schedule';

export function makeDeleteWorkScheduleUseCase(): DeleteWorkScheduleUseCase {
  const workSchedulesRepository = new PrismaWorkSchedulesRepository();
  const useCase = new DeleteWorkScheduleUseCase(workSchedulesRepository);

  return useCase;
}
