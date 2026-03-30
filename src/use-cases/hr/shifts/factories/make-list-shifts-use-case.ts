import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { ListShiftsUseCase } from '../list-shifts';

export function makeListShiftsUseCase(): ListShiftsUseCase {
  const shiftsRepository = new PrismaShiftsRepository();
  return new ListShiftsUseCase(shiftsRepository);
}
