import { PrismaOnboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-onboarding-checklists-repository';
import { CompleteOnboardingItemUseCase } from '../complete-onboarding-item';

export function makeCompleteOnboardingItemUseCase(): CompleteOnboardingItemUseCase {
  const onboardingChecklistsRepository =
    new PrismaOnboardingChecklistsRepository();
  return new CompleteOnboardingItemUseCase(onboardingChecklistsRepository);
}
