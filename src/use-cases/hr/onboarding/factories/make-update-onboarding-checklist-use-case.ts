import { PrismaOnboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-onboarding-checklists-repository';
import { UpdateOnboardingChecklistUseCase } from '../update-onboarding-checklist';

export function makeUpdateOnboardingChecklistUseCase(): UpdateOnboardingChecklistUseCase {
  const onboardingChecklistsRepository =
    new PrismaOnboardingChecklistsRepository();
  return new UpdateOnboardingChecklistUseCase(onboardingChecklistsRepository);
}
