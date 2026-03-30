import { PrismaPPEAssignmentsRepository } from '@/repositories/hr/prisma/prisma-ppe-assignments-repository';
import { ListExpiringAssignmentsUseCase } from '../list-expiring-assignments';

export function makeListExpiringAssignmentsUseCase() {
  const ppeAssignmentsRepository = new PrismaPPEAssignmentsRepository();
  return new ListExpiringAssignmentsUseCase(ppeAssignmentsRepository);
}
