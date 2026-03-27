import { PrismaBenefitEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-benefit-enrollments-repository';
import { ListEnrollmentsUseCase } from '../list-enrollments';

export function makeListEnrollmentsUseCase() {
  const benefitEnrollmentsRepository = new PrismaBenefitEnrollmentsRepository();
  return new ListEnrollmentsUseCase(benefitEnrollmentsRepository);
}
