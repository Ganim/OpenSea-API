import { PrismaTenantConsumptionsRepository } from '@/repositories/core/prisma/prisma-tenant-consumptions-repository';
import { GetAiUsageReportUseCase } from '../get-ai-usage-report';

export function makeGetAiUsageReportUseCase() {
  const tenantConsumptionsRepository = new PrismaTenantConsumptionsRepository();
  return new GetAiUsageReportUseCase(tenantConsumptionsRepository);
}
