import { TenantFeatureFlag } from '@/entities/core/tenant-feature-flag';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTenantFeatureFlagSchema,
  TenantFeatureFlagsRepository,
} from '../tenant-feature-flags-repository';

export class InMemoryTenantFeatureFlagsRepository
  implements TenantFeatureFlagsRepository
{
  public items: TenantFeatureFlag[] = [];

  async create(
    data: CreateTenantFeatureFlagSchema,
  ): Promise<TenantFeatureFlag> {
    const featureFlag = TenantFeatureFlag.create({
      tenantId: data.tenantId,
      flag: data.flag,
      enabled: data.enabled ?? false,
      metadata: data.metadata ?? {},
    });

    this.items.push(featureFlag);

    return featureFlag;
  }

  async findByTenantAndFlag(
    tenantId: UniqueEntityID,
    flag: string,
  ): Promise<TenantFeatureFlag | null> {
    const featureFlag = this.items.find(
      (item) => item.tenantId.equals(tenantId) && item.flag === flag,
    );

    return featureFlag ?? null;
  }

  async findByTenant(tenantId: UniqueEntityID): Promise<TenantFeatureFlag[]> {
    return this.items.filter((item) => item.tenantId.equals(tenantId));
  }

  async updateFlag(
    tenantId: UniqueEntityID,
    flag: string,
    enabled: boolean,
  ): Promise<TenantFeatureFlag | null> {
    const featureFlag = this.items.find(
      (item) => item.tenantId.equals(tenantId) && item.flag === flag,
    );
    if (!featureFlag) return null;

    featureFlag.enabled = enabled;

    return featureFlag;
  }

  async deleteFlag(tenantId: UniqueEntityID, flag: string): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.tenantId.equals(tenantId) && item.flag === flag,
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
