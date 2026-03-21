import type { TenantIntegrationStatusRepository } from '@/repositories/core/tenant-integration-status-repository';

interface IntegrationCountByStatus {
  CONNECTED: number;
  DISCONNECTED: number;
  ERROR: number;
  NOT_CONFIGURED: number;
}

interface IntegrationsByType {
  integrationType: string;
  total: number;
  byStatus: Record<string, number>;
}

interface TenantWithError {
  tenantId: string;
  integrationType: string;
  errorMessage: string | null;
  lastCheckAt: Date | null;
}

interface GetIntegrationStatusUseCaseResponse {
  totalIntegrations: number;
  countByStatus: IntegrationCountByStatus;
  byType: IntegrationsByType[];
  tenantsWithErrors: TenantWithError[];
}

export class GetIntegrationStatusUseCase {
  constructor(
    private integrationStatusRepository: TenantIntegrationStatusRepository,
  ) {}

  async execute(): Promise<GetIntegrationStatusUseCaseResponse> {
    const allIntegrations = await this.integrationStatusRepository.findAll();

    const countByStatus: IntegrationCountByStatus = {
      CONNECTED: 0,
      DISCONNECTED: 0,
      ERROR: 0,
      NOT_CONFIGURED: 0,
    };

    const typeMap = new Map<string, Record<string, number>>();
    const tenantsWithErrors: TenantWithError[] = [];

    for (const integration of allIntegrations) {
      const statusKey = integration.status as keyof IntegrationCountByStatus;
      if (statusKey in countByStatus) {
        countByStatus[statusKey]++;
      }

      // Group by integration type
      const typeStatusMap = typeMap.get(integration.integrationType) ?? {};
      typeStatusMap[integration.status] =
        (typeStatusMap[integration.status] ?? 0) + 1;
      typeMap.set(integration.integrationType, typeStatusMap);

      // Collect tenants with errors
      if (integration.status === 'ERROR') {
        tenantsWithErrors.push({
          tenantId: integration.tenantId,
          integrationType: integration.integrationType,
          errorMessage: integration.errorMessage,
          lastCheckAt: integration.lastCheckAt,
        });
      }
    }

    const byType: IntegrationsByType[] = Array.from(typeMap.entries()).map(
      ([integrationType, byStatus]) => ({
        integrationType,
        total: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
        byStatus,
      }),
    );

    return {
      totalIntegrations: allIntegrations.length,
      countByStatus,
      byType,
      tenantsWithErrors,
    };
  }
}
