import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { UnassignEmployeeFromShiftUseCase } from '../unassign-employee-from-shift';

export function makeUnassignEmployeeFromShiftUseCase(): UnassignEmployeeFromShiftUseCase {
  const shiftAssignmentsRepository = new PrismaShiftAssignmentsRepository();
  return new UnassignEmployeeFromShiftUseCase(shiftAssignmentsRepository);
}
