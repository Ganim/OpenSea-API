import { PrismaDeductionsRepository } from '@/repositories/hr/prisma/prisma-deductions-repository';
import { GetDeductionUseCase } from '../get-deduction';

export function makeGetDeductionUseCase() {
  const deductionsRepository = new PrismaDeductionsRepository();
  return new GetDeductionUseCase(deductionsRepository);
}
