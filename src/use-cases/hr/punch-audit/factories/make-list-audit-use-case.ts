import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { PrismaPunchApprovalsRepository } from '@/repositories/hr/prisma/prisma-punch-approvals-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { ListAuditUseCaseImpl } from '../list-audit-impl';

/**
 * Phase 9 / Plan 09-02 — Factory for ListAuditUseCase.
 * Wires Prisma repositories for time entries, punch approvals, and employees.
 */
export function makeListAuditUseCase() {
  const timeEntriesRepo = new PrismaTimeEntriesRepository();
  const punchApprovalsRepo = new PrismaPunchApprovalsRepository();
  const employeesRepo = new PrismaEmployeesRepository();

  return new ListAuditUseCaseImpl(
    timeEntriesRepo,
    punchApprovalsRepo,
    employeesRepo,
  );
}
