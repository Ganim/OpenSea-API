import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { UpdateApplicationStatusUseCase } from '../update-application-status';

export function makeUpdateApplicationStatusUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  return new UpdateApplicationStatusUseCase(applicationsRepository);
}
