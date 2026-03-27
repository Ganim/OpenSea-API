import { PrismaOnboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-onboarding-checklists-repository';
import { CreateOnboardingChecklistUseCase } from '../create-onboarding-checklist';

export function makeCreateOnboardingChecklistUseCase(): CreateOnboardingChecklistUseCase {
  const onboardingChecklistsRepository =
    new PrismaOnboardingChecklistsRepository();
  return new CreateOnboardingChecklistUseCase(onboardingChecklistsRepository);
}
