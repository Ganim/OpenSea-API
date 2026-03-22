import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { TenantIntegrationStatus } from '@/entities/core/tenant-integration-status';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SkillPricingRepository } from '@/repositories/core/skill-pricing-repository';
import type { TenantIntegrationStatusRepository } from '@/repositories/core/tenant-integration-status-repository';
import type { TenantSubscriptionsRepository } from '@/repositories/core/tenant-subscriptions-repository';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface GetTenantOverviewUseCaseRequest {
  tenantId: string;
}

interface GetTenantOverviewUseCaseResponse {
  tenantName: string;
  tenantStatus: string;
  subscriptionCount: number;
  totalMRR: number;
  activeUsers: number;
  integrations: TenantIntegrationStatus[];
}

export class GetTenantOverviewUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantSubscriptionsRepository: TenantSubscriptionsRepository,
    private skillPricingRepository: SkillPricingRepository,
    private tenantUsersRepository: TenantUsersRepository,
    private tenantIntegrationStatusRepository: TenantIntegrationStatusRepository,
  ) {}

  async execute({
    tenantId,
  }: GetTenantOverviewUseCaseRequest): Promise<GetTenantOverviewUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const activeSubscriptions =
      await this.tenantSubscriptionsRepository.findActiveByTenantId(tenantId);

    let totalMRR = 0;

    for (const subscription of activeSubscriptions) {
      if (subscription.customPrice !== null) {
        totalMRR += subscription.customPrice * subscription.quantity;
        continue;
      }

      const pricing = await this.skillPricingRepository.findBySkillCode(
        subscription.skillCode,
      );

      if (pricing?.flatPrice !== null && pricing?.flatPrice !== undefined) {
        totalMRR += pricing.flatPrice * subscription.quantity;
      }
    }

    const activeUsers = await this.tenantUsersRepository.countByTenant(
      new UniqueEntityID(tenantId),
    );

    const integrations =
      await this.tenantIntegrationStatusRepository.findByTenantId(tenantId);

    return {
      tenantName: tenant.name,
      tenantStatus: tenant.status,
      subscriptionCount: activeSubscriptions.length,
      totalMRR,
      activeUsers,
      integrations,
    };
  }
}
