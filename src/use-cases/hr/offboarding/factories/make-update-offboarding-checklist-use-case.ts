import { PrismaOffboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-offboarding-checklists-repository';
import { UpdateOffboardingChecklistUseCase } from '../update-offboarding-checklist';

export function makeUpdateOffboardingChecklistUseCase(): UpdateOffboardingChecklistUseCase {
  const offboardingChecklistsRepository =
    new PrismaOffboardingChecklistsRepository();
  return new UpdateOffboardingChecklistUseCase(offboardingChecklistsRepository);
}
