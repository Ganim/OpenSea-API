import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { ResolvePunchApprovalUseCase } from '../resolve-punch-approval';

export function makeResolvePunchApprovalUseCase() {
  return new ResolvePunchApprovalUseCase(new PrismaPunchApprovalsRepository());
}
