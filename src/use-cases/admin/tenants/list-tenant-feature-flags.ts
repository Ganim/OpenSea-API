import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantFeatureFlagDTO,
  tenantFeatureFlagToDTO,
} from '@/mappers/core/tenant/tenant-feature-flag-to-dto';
import type { TenantFeatureFlagsRepository } from '@/repositories/core/tenant-feature-flags-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface ListTenantFeatureFlagsUseCaseRequest {
  tenantId: string;
}

interface ListTenantFeatureFlagsUseCaseResponse {
  featureFlags: TenantFeatureFlagDTO[];
}

export class ListTenantFeatureFlagsUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantFeatureFlagsRepository: TenantFeatureFlagsRepository,
  ) {}

  async execute({
    tenantId,
  }: ListTenantFeatureFlagsUseCaseRequest): Promise<ListTenantFeatureFlagsUseCaseResponse> {
    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const flags = await this.tenantFeatureFlagsRepository.findByTenant(
      new UniqueEntityID(tenantId),
    );

    return {
      featureFlags: flags.map(tenantFeatureFlagToDTO),
    };
  }
}
