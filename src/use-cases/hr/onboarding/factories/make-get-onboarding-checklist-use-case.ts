import { PrismaOnboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-onboarding-checklists-repository';
import { GetOnboardingChecklistUseCase } from '../get-onboarding-checklist';

export function makeGetOnboardingChecklistUseCase(): GetOnboardingChecklistUseCase {
  const onboardingChecklistsRepository =
    new PrismaOnboardingChecklistsRepository();
  return new GetOnboardingChecklistUseCase(onboardingChecklistsRepository);
}
