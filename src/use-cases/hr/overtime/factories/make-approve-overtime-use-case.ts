import { PrismaOvertimeRepository } from '@/repositories/hr/prisma/prisma-overtime-repository';
import { PrismaTimeBankRepository } from '@/repositories/hr/prisma/prisma-time-bank-repository';
import { ApproveOvertimeUseCase } from '../approve-overtime';

export function makeApproveOvertimeUseCase(): ApproveOvertimeUseCase {
  const overtimeRepository = new PrismaOvertimeRepository();
  const timeBankRepository = new PrismaTimeBankRepository();
  const useCase = new ApproveOvertimeUseCase(
    overtimeRepository,
    timeBankRepository,
  );

  return useCase;
}
