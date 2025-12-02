import { PrismaDeductionsRepository } from '@/repositories/hr/prisma/prisma-deductions-repository';
import { ListDeductionsUseCase } from '../list-deductions';

export function makeListDeductionsUseCase() {
  const deductionsRepository = new PrismaDeductionsRepository();
  return new ListDeductionsUseCase(deductionsRepository);
}
