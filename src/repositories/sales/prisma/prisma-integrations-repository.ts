import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Integration } from '@/entities/sales/integration';
import { prisma } from '@/lib/prisma';
import type { IntegrationsRepository } from '../integrations-repository';

function mapToDomain(raw: Record<string, unknown>): Integration {
  return Integration.create(
    {
      name: raw.name as string,
      slug: raw.slug as string,
      description: (raw.description as string) ?? undefined,
      logoUrl: (raw.logoUrl as string) ?? undefined,
      category: raw.category as string,
      configSchema: (raw.configSchema as Record<string, unknown>) ?? {},
      isAvailable: raw.isAvailable as boolean,
      createdAt: raw.createdAt as Date,
      updatedAt: (raw.updatedAt as Date) ?? undefined,
    },
    new EntityID(raw.id as string),
  );
}

export class PrismaIntegrationsRepository implements IntegrationsRepository {
  async findAll(): Promise<Integration[]> {
    const integrations = await prisma.integration.findMany({
      where: { isAvailable: true },
      orderBy: { name: 'asc' },
    });

    return integrations.map((integration) =>
      mapToDomain(integration as unknown as Record<string, unknown>),
    );
  }

  async findById(id: UniqueEntityID): Promise<Integration | null> {
    const integration = await prisma.integration.findUnique({
      where: { id: id.toString() },
    });

    if (!integration) return null;
    return mapToDomain(integration as unknown as Record<string, unknown>);
  }

  async findBySlug(slug: string): Promise<Integration | null> {
    const integration = await prisma.integration.findUnique({
      where: { slug },
    });

    if (!integration) return null;
    return mapToDomain(integration as unknown as Record<string, unknown>);
  }
}
