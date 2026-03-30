import { PrismaApplicationsRepository } from '@/repositories/hr/prisma/prisma-applications-repository';
import { ListApplicationsUseCase } from '../list-applications';

export function makeListApplicationsUseCase() {
  const applicationsRepository = new PrismaApplicationsRepository();
  return new ListApplicationsUseCase(applicationsRepository);
}
