import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type TenantFeatureFlagDTO,
  tenantFeatureFlagToDTO,
} from '@/mappers/core/tenant/tenant-feature-flag-to-dto';
import type { TenantFeatureFlagsRepository } from '@/repositories/core/tenant-feature-flags-repository';
import type { TenantsRepository } from '@/repositories/core/tenants-repository';

interface ManageTenantFeatureFlagsUseCaseRequest {
  tenantId: string;
  flag: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

interface ManageTenantFeatureFlagsUseCaseResponse {
  featureFlag: TenantFeatureFlagDTO;
}

export class ManageTenantFeatureFlagsUseCase {
  constructor(
    private tenantsRepository: TenantsRepository,
    private tenantFeatureFlagsRepository: TenantFeatureFlagsRepository,
  ) {}

  async execute({
    tenantId,
    flag,
    enabled,
    metadata,
  }: ManageTenantFeatureFlagsUseCaseRequest): Promise<ManageTenantFeatureFlagsUseCaseResponse> {
    if (!flag || flag.trim().length === 0) {
      throw new BadRequestError('Feature flag name cannot be empty');
    }

    const tenant = await this.tenantsRepository.findById(
      new UniqueEntityID(tenantId),
    );

    if (!tenant) {
      throw new ResourceNotFoundError('Tenant not found');
    }

    const existingFlag =
      await this.tenantFeatureFlagsRepository.findByTenantAndFlag(
        new UniqueEntityID(tenantId),
        flag.trim(),
      );

    if (existingFlag) {
      const updatedFlag = await this.tenantFeatureFlagsRepository.updateFlag(
        new UniqueEntityID(tenantId),
        flag.trim(),
        enabled,
      );

      if (!updatedFlag) {
        throw new ResourceNotFoundError('Feature flag not found');
      }

      return { featureFlag: tenantFeatureFlagToDTO(updatedFlag) };
    }

    const createdFlag = await this.tenantFeatureFlagsRepository.create({
      tenantId: new UniqueEntityID(tenantId),
      flag: flag.trim(),
      enabled,
      metadata: metadata ?? {},
    });

    return { featureFlag: tenantFeatureFlagToDTO(createdFlag) };
  }
}
