import { PrismaOvertimeRepository } from '@/repositories/hr/prisma/prisma-overtime-repository';
import { RejectOvertimeUseCase } from '../reject-overtime';

export function makeRejectOvertimeUseCase(): RejectOvertimeUseCase {
  const overtimeRepository = new PrismaOvertimeRepository();
  const useCase = new RejectOvertimeUseCase(overtimeRepository);

  return useCase;
}
