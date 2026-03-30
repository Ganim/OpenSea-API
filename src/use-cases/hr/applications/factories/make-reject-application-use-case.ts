import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { RejectApplicationUseCase } from '../reject-application';

export function makeRejectApplicationUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  return new RejectApplicationUseCase(applicationsRepository);
}
