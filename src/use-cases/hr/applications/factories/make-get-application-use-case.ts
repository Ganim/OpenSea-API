import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { GetApplicationUseCase } from '../get-application';

export function makeGetApplicationUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  return new GetApplicationUseCase(applicationsRepository);
}
