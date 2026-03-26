import { PrismaDeductionsRepository } from '@/repositories/hr/prisma/prisma-deductions-repository';
import { UpdateDeductionUseCase } from '../update-deduction';

export function makeUpdateDeductionUseCase() {
  const deductionsRepository = new PrismaDeductionsRepository();
  return new UpdateDeductionUseCase(deductionsRepository);
}
