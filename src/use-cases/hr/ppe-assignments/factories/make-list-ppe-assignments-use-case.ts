import { PrismaPPEAssignmentsRepository } from '@/repositories/hr/prisma/prisma-ppe-assignments-repository';
import { ListPPEAssignmentsUseCase } from '../list-ppe-assignments';

export function makeListPPEAssignmentsUseCase() {
  const ppeAssignmentsRepository = new PrismaPPEAssignmentsRepository();
  return new ListPPEAssignmentsUseCase(ppeAssignmentsRepository);
}
