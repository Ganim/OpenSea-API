import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TenantPaymentConfig } from '@/entities/sales/tenant-payment-config';
import { prisma } from '@/lib/prisma';
import type {
  PaymentConfigsRepository,
  SavePaymentConfigSchema,
} from '../payment-configs-repository';

function mapToDomain(data: Record<string, unknown>): TenantPaymentConfig {
  return TenantPaymentConfig.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      primaryProvider: data.primaryProvider as string,
      primaryConfig: data.primaryConfig as string,
      primaryActive: data.primaryActive as boolean,
      primaryTestedAt: (data.primaryTestedAt as Date) ?? undefined,
      fallbackProvider: (data.fallbackProvider as string) ?? undefined,
      fallbackConfig: (data.fallbackConfig as string) ?? undefined,
      fallbackActive: data.fallbackActive as boolean,
      fallbackTestedAt: (data.fallbackTestedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    },
    new UniqueEntityID(data.id as string),
  );
}

export class PrismaPaymentConfigsRepository
  implements PaymentConfigsRepository
{
  async findByTenantId(tenantId: string): Promise<TenantPaymentConfig | null> {
    const configData = await prisma.tenantPaymentConfig.findUnique({
      where: { tenantId },
    });

    if (!configData) return null;

    return mapToDomain(configData as unknown as Record<string, unknown>);
  }

  async save(data: SavePaymentConfigSchema): Promise<TenantPaymentConfig> {
    const configData = await prisma.tenantPaymentConfig.upsert({
      where: { tenantId: data.tenantId },
      create: {
        tenantId: data.tenantId,
        primaryProvider: data.primaryProvider,
        primaryConfig: data.primaryConfig,
        primaryActive: data.primaryActive,
        primaryTestedAt: data.primaryTestedAt,
        fallbackProvider: data.fallbackProvider,
        fallbackConfig: data.fallbackConfig,
        fallbackActive: data.fallbackActive,
        fallbackTestedAt: data.fallbackTestedAt,
      },
      update: {
        primaryProvider: data.primaryProvider,
        primaryConfig: data.primaryConfig,
        primaryActive: data.primaryActive,
        primaryTestedAt: data.primaryTestedAt,
        fallbackProvider: data.fallbackProvider,
        fallbackConfig: data.fallbackConfig,
        fallbackActive: data.fallbackActive,
        fallbackTestedAt: data.fallbackTestedAt,
      },
    });

    return mapToDomain(configData as unknown as Record<string, unknown>);
  }

  async updateTestedAt(
    tenantId: string,
    slot: 'primary' | 'fallback',
    testedAt: Date,
  ): Promise<void> {
    const updateData =
      slot === 'primary'
        ? { primaryTestedAt: testedAt }
        : { fallbackTestedAt: testedAt };

    await prisma.tenantPaymentConfig.update({
      where: { tenantId },
      data: updateData,
    });
  }
}
