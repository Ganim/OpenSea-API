import { PrismaOnboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-onboarding-checklists-repository';
import { ListOnboardingChecklistsUseCase } from '../list-onboarding-checklists';

export function makeListOnboardingChecklistsUseCase(): ListOnboardingChecklistsUseCase {
  const onboardingChecklistsRepository =
    new PrismaOnboardingChecklistsRepository();
  return new ListOnboardingChecklistsUseCase(onboardingChecklistsRepository);
}
