import { AuditModule } from '@/entities/audit/audit-module.enum';
import type { AuditLogsRepository } from '@/repositories/audit/audit-logs-repository';
import type { PlansRepository } from '@/repositories/core/plans-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface RecentActivityItem {
  id: string;
  action: string;
  entity: string;
  description: string | null;
  createdAt: Date;
}

interface GetSystemStatsUseCaseResponse {
  totalTenants: number;
  totalPlans: number;
  activePlans: number;
  tenantsByStatus: Record<string, number>;
  tenantsByTier: Record<string, number>;
  monthlyGrowth: Array<{ month: string; count: number }>;
  recentActivity: RecentActivityItem[];
  totalUsers: number;
  mrr: number;
}

export class GetSystemStatsUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private plansRepository: PlansRepository,
    private auditLogsRepository: AuditLogsRepository,
  ) {}

  async execute(): Promise<GetSystemStatsUseCaseResponse> {
    const [
      totalTenants,
      allPlans,
      tenantsByStatus,
      monthlyGrowth,
      recentLogs,
      totalUsers,
      tenantsByTier,
      mrr,
    ] = await Promise.all([
      this.tenantsRepository.countAll(),
      this.plansRepository.findMany(),
      this.tenantsRepository.countByStatus(),
      this.tenantsRepository.countMonthlyGrowth(12),
      this.auditLogsRepository.listByModule(AuditModule.ADMIN, { limit: 10 }),
      this.tenantsRepository.countTotalUsers(),
      this.tenantsRepository.countTenantsByPlanTier(),
      this.tenantsRepository.calculateMrr(),
    ]);

    const activePlans = allPlans.filter((plan) => plan.isActive).length;

    // Map recent audit logs to activity items
    const recentActivity: RecentActivityItem[] = recentLogs.map((log) => ({
      id: log.id.toString(),
      action: log.action,
      entity: log.entity,
      description: log.description,
      createdAt: log.createdAt,
    }));

    return {
      totalTenants,
      totalPlans: allPlans.length,
      activePlans,
      tenantsByStatus,
      tenantsByTier,
      monthlyGrowth,
      recentActivity,
      totalUsers,
      mrr,
    };
  }
}
