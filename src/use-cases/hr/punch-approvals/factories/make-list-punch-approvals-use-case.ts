import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { ListPunchApprovalsUseCase } from '../list-punch-approvals';

export function makeListPunchApprovalsUseCase() {
  return new ListPunchApprovalsUseCase(new PrismaPunchApprovalsRepository());
}
