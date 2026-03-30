import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { TransferEmployeeShiftUseCase } from '../transfer-employee-shift';

export function makeTransferEmployeeShiftUseCase(): TransferEmployeeShiftUseCase {
  const shiftsRepository = new PrismaShiftsRepository();
  const shiftAssignmentsRepository = new PrismaShiftAssignmentsRepository();
  return new TransferEmployeeShiftUseCase(
    shiftsRepository,
    shiftAssignmentsRepository,
  );
}
