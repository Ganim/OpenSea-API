import { PrismaOvertimeRepository } from '@/repositories/hr/prisma/prisma-overtime-repository';
import { GetOvertimeUseCase } from '../get-overtime';

export function makeGetOvertimeUseCase(): GetOvertimeUseCase {
  const overtimeRepository = new PrismaOvertimeRepository();
  const useCase = new GetOvertimeUseCase(overtimeRepository);

  return useCase;
}
