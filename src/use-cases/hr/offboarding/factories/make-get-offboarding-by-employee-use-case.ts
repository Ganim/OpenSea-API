import { PrismaOffboardingChecklistsRepository } from '@/repositories/hr/prisma/prisma-offboarding-checklists-repository';
import { GetOffboardingByEmployeeUseCase } from '../get-offboarding-by-employee';

export function makeGetOffboardingByEmployeeUseCase(): GetOffboardingByEmployeeUseCase {
  const offboardingChecklistsRepository =
    new PrismaOffboardingChecklistsRepository();
  return new GetOffboardingByEmployeeUseCase(offboardingChecklistsRepository);
}
