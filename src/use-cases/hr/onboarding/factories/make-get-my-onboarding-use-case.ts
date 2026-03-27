import { PrismaOnboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-onboarding-checklists-repository';
import { GetMyOnboardingUseCase } from '../get-my-onboarding';

export function makeGetMyOnboardingUseCase(): GetMyOnboardingUseCase {
  const onboardingChecklistsRepository =
    new PrismaOnboardingChecklistsRepository();
  return new GetMyOnboardingUseCase(onboardingChecklistsRepository);
}
