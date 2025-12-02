import { PrismaDeductionsRepository } from '@/repositories/hr/prisma/prisma-deductions-repository';
import { DeleteDeductionUseCase } from '../delete-deduction';

export function makeDeleteDeductionUseCase() {
  const deductionsRepository = new PrismaDeductionsRepository();
  return new DeleteDeductionUseCase(deductionsRepository);
}
