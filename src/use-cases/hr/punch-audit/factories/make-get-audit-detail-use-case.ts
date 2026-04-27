import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';

import { GetAuditDetailUseCaseImpl } from '../get-audit-detail-impl';

/**
 * Phase 9 / Plan 09-02 — Factory for GetAuditDetailUseCase.
 * Loads TimeEntry or PunchApproval detail with signals + previous entry.
 */
export function makeGetAuditDetailUseCase() {
  const timeEntriesRepo = new PrismaTimeEntriesRepository();
  const punchApprovalsRepo = new PrismaPunchApprovalsRepository();

  return new GetAuditDetailUseCaseImpl(timeEntriesRepo, punchApprovalsRepo);
}
