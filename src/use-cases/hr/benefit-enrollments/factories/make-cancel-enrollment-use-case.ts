import { PrismaBenefitEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-benefit-enrollments-repository';
import { CancelEnrollmentUseCase } from '../cancel-enrollment';

export function makeCancelEnrollmentUseCase() {
  const benefitEnrollmentsRepository = new PrismaBenefitEnrollmentsRepository();
  return new CancelEnrollmentUseCase(benefitEnrollmentsRepository);
}
