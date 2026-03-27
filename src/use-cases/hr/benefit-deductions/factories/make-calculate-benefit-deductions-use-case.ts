import { PrismaBenefitEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-benefit-enrollments-repository';
import { PrismaBenefitPlansRepository } from '@/repositories/hr/prisma/prisma-benefit-plans-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CalculateBenefitDeductionsUseCase } from '../calculate-benefit-deductions';

export function makeCalculateBenefitDeductionsUseCase() {
  const benefitEnrollmentsRepository = new PrismaBenefitEnrollmentsRepository();
  const benefitPlansRepository = new PrismaBenefitPlansRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new CalculateBenefitDeductionsUseCase(
    benefitEnrollmentsRepository,
    benefitPlansRepository,
    employeesRepository,
  );
}
