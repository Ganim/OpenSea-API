import { TenantAuthConfig } from '@/entities/core/tenant-auth-config';
import type { AuthLinkProvider } from '@/entities/core/auth-link';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import type {
  CreateTenantAuthConfigSchema,
  TenantAuthConfigRepository,
  UpdateTenantAuthConfigSchema,
} from '../tenant-auth-config-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToDomain(raw: any): TenantAuthConfig {
  return TenantAuthConfig.create(
    {
      tenantId: raw.tenantId,
      allowedMethods: (raw.allowedMethods ?? ['EMAIL']) as AuthLinkProvider[],
      magicLinkEnabled: raw.magicLinkEnabled,
      magicLinkExpiresIn: raw.magicLinkExpiresIn,
      defaultMethod: (raw.defaultMethod as AuthLinkProvider) ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    raw.id,
  );
}

export class PrismaTenantAuthConfigRepository
  implements TenantAuthConfigRepository
{
  // CREATE
  // - create(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;

  async create(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig> {
    const raw = await prisma.tenantAuthConfig.create({
      data: {
        tenantId: data.tenantId.toString(),
        allowedMethods: data.allowedMethods ?? ['EMAIL'],
        magicLinkEnabled: data.magicLinkEnabled ?? false,
        magicLinkExpiresIn: data.magicLinkExpiresIn ?? 15,
        defaultMethod: data.defaultMethod ?? null,
      },
    });

    return mapToDomain(raw);
  }

  // RETRIEVE
  // - findByTenantId(tenantId: UniqueEntityID): Promise<TenantAuthConfig | null>;

  async findByTenantId(
    tenantId: UniqueEntityID,
  ): Promise<TenantAuthConfig | null> {
    const raw = await prisma.tenantAuthConfig.findUnique({
      where: { tenantId: tenantId.toString() },
    });

    if (!raw) return null;

    return mapToDomain(raw);
  }

  // UPDATE
  // - update(data: UpdateTenantAuthConfigSchema): Promise<TenantAuthConfig | null>;

  async update(
    data: UpdateTenantAuthConfigSchema,
  ): Promise<TenantAuthConfig | null> {
    try {
      const raw = await prisma.tenantAuthConfig.update({
        where: { id: data.id.toString() },
        data: {
          allowedMethods: data.allowedMethods,
          magicLinkEnabled: data.magicLinkEnabled,
          magicLinkExpiresIn: data.magicLinkExpiresIn,
          defaultMethod: data.defaultMethod,
        },
      });

      return mapToDomain(raw);
    } catch {
      return null;
    }
  }

  // UPSERT
  // - upsert(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig>;

  async upsert(data: CreateTenantAuthConfigSchema): Promise<TenantAuthConfig> {
    const tenantIdStr = data.tenantId.toString();

    const raw = await prisma.tenantAuthConfig.upsert({
      where: { tenantId: tenantIdStr },
      create: {
        tenantId: tenantIdStr,
        allowedMethods: data.allowedMethods ?? ['EMAIL'],
        magicLinkEnabled: data.magicLinkEnabled ?? false,
        magicLinkExpiresIn: data.magicLinkExpiresIn ?? 15,
        defaultMethod: data.defaultMethod ?? null,
      },
      update: {
        allowedMethods: data.allowedMethods,
        magicLinkEnabled: data.magicLinkEnabled,
        magicLinkExpiresIn: data.magicLinkExpiresIn,
        defaultMethod: data.defaultMethod,
      },
    });

    return mapToDomain(raw);
  }
}
