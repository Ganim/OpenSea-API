import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { CreateShiftUseCase } from '../create-shift';

export function makeCreateShiftUseCase(): CreateShiftUseCase {
  const shiftsRepository = new PrismaShiftsRepository();
  return new CreateShiftUseCase(shiftsRepository);
}
