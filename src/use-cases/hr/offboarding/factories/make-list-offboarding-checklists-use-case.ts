import { PrismaOffboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-offboarding-checklists-repository';
import { ListOffboardingChecklistsUseCase } from '../list-offboarding-checklists';

export function makeListOffboardingChecklistsUseCase(): ListOffboardingChecklistsUseCase {
  const offboardingChecklistsRepository =
    new PrismaOffboardingChecklistsRepository();
  return new ListOffboardingChecklistsUseCase(offboardingChecklistsRepository);
}
