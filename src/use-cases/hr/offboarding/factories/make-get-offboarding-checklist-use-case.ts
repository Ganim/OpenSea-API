import { PrismaOffboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-offboarding-checklists-repository';
import { GetOffboardingChecklistUseCase } from '../get-offboarding-checklist';

export function makeGetOffboardingChecklistUseCase(): GetOffboardingChecklistUseCase {
  const offboardingChecklistsRepository =
    new PrismaOffboardingChecklistsRepository();
  return new GetOffboardingChecklistUseCase(offboardingChecklistsRepository);
}
