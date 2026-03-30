import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { UpdateShiftUseCase } from '../update-shift';

export function makeUpdateShiftUseCase(): UpdateShiftUseCase {
  const shiftsRepository = new PrismaShiftsRepository();
  return new UpdateShiftUseCase(shiftsRepository);
}
