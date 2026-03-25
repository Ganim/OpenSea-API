import { PrismaTenantConsumptionsRepository } from '@/repositories/core/prisma/prisma-tenant-consumptions-repository';
import { GetApiUsageReportUseCase } from '../get-api-usage-report';

export function makeGetApiUsageReportUseCase() {
  const tenantConsumptionsRepository = new PrismaTenantConsumptionsRepository();
  return new GetApiUsageReportUseCase(tenantConsumptionsRepository);
}
