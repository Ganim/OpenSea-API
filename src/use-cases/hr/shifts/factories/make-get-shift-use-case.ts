import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { GetShiftUseCase } from '../get-shift';

export function makeGetShiftUseCase(): GetShiftUseCase {
  const shiftsRepository = new PrismaShiftsRepository();
  return new GetShiftUseCase(shiftsRepository);
}
