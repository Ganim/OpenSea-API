import { PrismaOffboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-offboarding-checklists-repository';
import { DeleteOffboardingChecklistUseCase } from '../delete-offboarding-checklist';

export function makeDeleteOffboardingChecklistUseCase(): DeleteOffboardingChecklistUseCase {
  const offboardingChecklistsRepository =
    new PrismaOffboardingChecklistsRepository();
  return new DeleteOffboardingChecklistUseCase(offboardingChecklistsRepository);
}
