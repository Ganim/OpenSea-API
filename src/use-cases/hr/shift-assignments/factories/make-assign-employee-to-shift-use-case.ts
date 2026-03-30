import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { PrismaShiftsRepository } from '@/repositories/hr/prisma/prisma-shifts-repository';
import { AssignEmployeeToShiftUseCase } from '../assign-employee-to-shift';

export function makeAssignEmployeeToShiftUseCase(): AssignEmployeeToShiftUseCase {
  const shiftsRepository = new PrismaShiftsRepository();
  const shiftAssignmentsRepository = new PrismaShiftAssignmentsRepository();
  return new AssignEmployeeToShiftUseCase(
    shiftsRepository,
    shiftAssignmentsRepository,
  );
}
