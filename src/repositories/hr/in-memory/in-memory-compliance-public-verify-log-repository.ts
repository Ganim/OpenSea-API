import type { ComplianceVerifyLog } from '@/entities/hr/compliance-public-verify-log';
import type { ComplianceVerifyLogRepository } from '../compliance-public-verify-log-repository';

export class InMemoryComplianceVerifyLogRepository
  implements ComplianceVerifyLogRepository
{
  public items: ComplianceVerifyLog[] = [];

  async create(log: ComplianceVerifyLog): Promise<void> {
    this.items.push(log);
  }

  async countByNsrHashSince(nsrHash: string, since: Date): Promise<number> {
    return this.items.filter(
      (log) => log.nsrHash === nsrHash && log.accessedAt >= since,
    ).length;
  }
}
