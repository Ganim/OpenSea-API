import { PrismaAuditLogsRepository } from '@/repositories/audit/prisma/prisma-audit-logs-repository';
import { PrismaPlansRepository } from '@/repositories/core/prisma/prisma-plans-repository';
import { PrismaTenantsRepository } from '@/repositories/core/prisma/prisma-tenants-repository';
import { GetSystemStatsUseCase } from '../get-system-stats';

export function makeGetSystemStatsUseCase() {
  const tenantsRepository = new PrismaTenantsRepository();
  const plansRepository = new PrismaPlansRepository();
  const auditLogsRepository = new PrismaAuditLogsRepository();
  return new GetSystemStatsUseCase(
    tenantsRepository,
    plansRepository,
    auditLogsRepository,
  );
}
