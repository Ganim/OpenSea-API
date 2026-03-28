import { PrismaOnboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-onboarding-checklists-repository';
import { DeleteOnboardingChecklistUseCase } from '../delete-onboarding-checklist';

export function makeDeleteOnboardingChecklistUseCase(): DeleteOnboardingChecklistUseCase {
  const onboardingChecklistsRepository =
    new PrismaOnboardingChecklistsRepository();
  return new DeleteOnboardingChecklistUseCase(onboardingChecklistsRepository);
}
