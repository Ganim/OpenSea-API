import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { ListAssignmentsByEmployeeUseCase } from '../list-assignments-by-employee';

export function makeListAssignmentsByEmployeeUseCase(): ListAssignmentsByEmployeeUseCase {
  const shiftAssignmentsRepository = new PrismaShiftAssignmentsRepository();
  return new ListAssignmentsByEmployeeUseCase(shiftAssignmentsRepository);
}
