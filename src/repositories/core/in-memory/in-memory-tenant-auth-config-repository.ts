import { TenantAuthConfig } from '@/entities/core/tenant-auth-config';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CreateTenantAuthConfigSchema,
  TenantAuthConfigRepository,
  UpdateTenantAuthConfigSchema,
} from '@/repositories/core/tenant-auth-config-repository';

export class InMemoryTenantAuthConfigRepository
  implements TenantAuthConfigRepository
{
  // IN MEMORY DATABASE
  private items: TenantAuthConfig[] = [];

  // CREATE
  // - create(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;

  async create(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig> {
    const config = TenantAuthConfig.create(
      {
        tenantId: data.tenantId,
        allowedMethods: data.allowedMethods,
        magicLinkEnabled: data.magicLinkEnabled,
        magicLinkExpiresIn: data.magicLinkExpiresIn,
        defaultMethod: data.defaultMethod ?? null,
      },
      new UniqueEntityID(),
    );

    this.items.push(config);

    return config;
  }

  // RETRIEVE
  // - findByTenantId(tenantId: UniqueEntityID): Promise<TenantAuthConfig | null>;

  async findByTenantId(
    tenantId: UniqueEntityID,
  ): Promise<TenantAuthConfig | null> {
    const item = this.items.find((item) => item.tenantId.equals(tenantId));

    if (!item) return null;

    return item;
  }

  // UPDATE
  // - update(data: UpdateTenantAuthConfigSchema): Promise<TenantAuthConfig | null>;

  async update(
    data: UpdateTenantAuthConfigSchema,
  ): Promise<TenantAuthConfig | null> {
    const item = this.items.find((item) => item.id.equals(data.id));

    if (!item) return null;

    if (data.allowedMethods !== undefined)
      item.allowedMethods = data.allowedMethods;
    if (data.magicLinkEnabled !== undefined)
      item.magicLinkEnabled = data.magicLinkEnabled;
    if (data.magicLinkExpiresIn !== undefined)
      item.magicLinkExpiresIn = data.magicLinkExpiresIn;
    if (data.defaultMethod !== undefined)
      item.defaultMethod = data.defaultMethod;

    return item;
  }

  // UPSERT
  // - upsert(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;

  async upsert(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig> {
    const existing = await this.findByTenantId(data.tenantId);

    if (existing) {
      if (data.allowedMethods !== undefined)
        existing.allowedMethods = data.allowedMethods;
      if (data.magicLinkEnabled !== undefined)
        existing.magicLinkEnabled = data.magicLinkEnabled;
      if (data.magicLinkExpiresIn !== undefined)
        existing.magicLinkExpiresIn = data.magicLinkExpiresIn;
      if (data.defaultMethod !== undefined)
        existing.defaultMethod = data.defaultMethod;

      return existing;
    }

    return this.create(data);
  }
}
