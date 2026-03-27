import { PrismaBenefitEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-benefit-enrollments-repository';
import { UpdateEnrollmentUseCase } from '../update-enrollment';

export function makeUpdateEnrollmentUseCase() {
  const benefitEnrollmentsRepository = new PrismaBenefitEnrollmentsRepository();
  return new UpdateEnrollmentUseCase(benefitEnrollmentsRepository);
}
