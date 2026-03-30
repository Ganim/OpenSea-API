import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { HireApplicationUseCase } from '../hire-application';

export function makeHireApplicationUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  return new HireApplicationUseCase(applicationsRepository);
}
