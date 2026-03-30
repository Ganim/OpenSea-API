import { PrismaShiftAssignmentsRepository } from '@/repositories/hr/prisma/prisma-shift-assignments-repository';
import { ListAssignmentsByShiftUseCase } from '../list-assignments-by-shift';

export function makeListAssignmentsByShiftUseCase(): ListAssignmentsByShiftUseCase {
  const shiftAssignmentsRepository = new PrismaShiftAssignmentsRepository();
  return new ListAssignmentsByShiftUseCase(shiftAssignmentsRepository);
}
