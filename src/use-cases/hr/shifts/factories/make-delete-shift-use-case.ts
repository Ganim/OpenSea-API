import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { DeleteShiftUseCase } from '../delete-shift';

export function makeDeleteShiftUseCase(): DeleteShiftUseCase {
  const shiftsRepository = new PrismaShiftsRepository();
  return new DeleteShiftUseCase(shiftsRepository);
}
