import { PrismaOffboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-offboarding-checklists-repository';
import { CreateOffboardingChecklistUseCase } from '../create-offboarding-checklist';

export function makeCreateOffboardingChecklistUseCase(): CreateOffboardingChecklistUseCase {
  const offboardingChecklistsRepository =
    new PrismaOffboardingChecklistsRepository();
  return new CreateOffboardingChecklistUseCase(offboardingChecklistsRepository);
}
