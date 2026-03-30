import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { PrismaInterviewStagesRepository } from '@/repositories/hr/prisma/prisma-interview-stages-repository';
import { PrismaInterviewsRepository } from '@/repositories/hr/prisma/prisma-interviews-repository';
import { ScheduleInterviewUseCase } from '../schedule-interview';

export function makeScheduleInterviewUseCase() {
  const interviewsRepository = new PrismaInterviewsRepository();
  const applicationsRepository = new PrismaApplicationsRepository();
  const interviewStagesRepository = new PrismaInterviewStagesRepository();
  return new ScheduleInterviewUseCase(
    interviewsRepository,
    applicationsRepository,
    interviewStagesRepository,
  );
}
