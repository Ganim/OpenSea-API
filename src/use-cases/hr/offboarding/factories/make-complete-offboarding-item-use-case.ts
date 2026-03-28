import { PrismaOffboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-offboarding-checklists-repository';
import { CompleteOffboardingItemUseCase } from '../complete-offboarding-item';

export function makeCompleteOffboardingItemUseCase(): CompleteOffboardingItemUseCase {
  const offboardingChecklistsRepository =
    new PrismaOffboardingChecklistsRepository();
  return new CompleteOffboardingItemUseCase(offboardingChecklistsRepository);
}
