import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Catalog } from '@/entities/sales/catalog';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  CatalogsRepository,
  FindManyCatalogsParams,
} from '../catalogs-repository';
import type {
  CatalogType as PrismaCatalogType,
  CatalogStatus as PrismaCatalogStatus,
  CatalogLayout as PrismaCatalogLayout,
} from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): Catalog {
  return Catalog.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      slug: (data.slug as string) ?? undefined,
      description: (data.description as string) ?? undefined,
      type: data.type as string,
      status: data.status as string,
      coverImageFileId: (data.coverImageFileId as string) ?? undefined,
      assignedToUserId: data.assignedToUserId
        ? new EntityID(data.assignedToUserId as string)
        : undefined,
      customerId: data.customerId
        ? new EntityID(data.customerId as string)
        : undefined,
      campaignId: data.campaignId
        ? new EntityID(data.campaignId as string)
        : undefined,
      rules: (data.rules as Record<string, unknown>) ?? undefined,
      aiCurated: data.aiCurated as boolean,
      aiCurationConfig:
        (data.aiCurationConfig as Record<string, unknown>) ?? undefined,
      layout: data.layout as string,
      showPrices: data.showPrices as boolean,
      showStock: data.showStock as boolean,
      priceTableId: data.priceTableId
        ? new EntityID(data.priceTableId as string)
        : undefined,
      isPublic: data.isPublic as boolean,
      publicUrl: (data.publicUrl as string) ?? undefined,
      qrCodeUrl: (data.qrCodeUrl as string) ?? undefined,
      deletedAt: (data.deletedAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
      updatedAt: (data.updatedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaCatalogsRepository implements CatalogsRepository {
  async create(catalog: Catalog): Promise<void> {
    await prisma.catalog.create({
      data: {
        id: catalog.id.toString(),
        tenantId: catalog.tenantId.toString(),
        name: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        type: catalog.type as PrismaCatalogType,
        status: catalog.status as PrismaCatalogStatus,
        coverImageFileId: catalog.coverImageFileId,
        assignedToUserId: catalog.assignedToUserId?.toString(),
        customerId: catalog.customerId?.toString(),
        campaignId: catalog.campaignId?.toString(),
        rules: catalog.rules ?? undefined,
        aiCurated: catalog.aiCurated,
        aiCurationConfig: catalog.aiCurationConfig ?? undefined,
        layout: catalog.layout as PrismaCatalogLayout,
        showPrices: catalog.showPrices,
        showStock: catalog.showStock,
        priceTableId: catalog.priceTableId?.toString(),
        isPublic: catalog.isPublic,
        publicUrl: catalog.publicUrl,
        qrCodeUrl: catalog.qrCodeUrl,
        createdAt: catalog.createdAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Catalog | null> {
    const data = await prisma.catalog.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findBySlug(slug: string, tenantId: string): Promise<Catalog | null> {
    const data = await prisma.catalog.findFirst({
      where: {
        slug,
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) return null;
    return mapToDomain(data as unknown as Record<string, unknown>);
  }

  async findManyPaginated(
    params: FindManyCatalogsParams,
  ): Promise<PaginatedResult<Catalog>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.type) {
      where.type = params.type;
    }

    if (params.isPublic !== undefined) {
      where.isPublic = params.isPublic;
    }

    const [items, total] = await Promise.all([
      prisma.catalog.findMany({
        where,
        orderBy: {
          [params.sortBy ?? 'createdAt']: params.sortOrder ?? 'desc',
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.catalog.count({ where }),
    ]);

    return {
      data: items.map((d) =>
        mapToDomain(d as unknown as Record<string, unknown>),
      ),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(catalog: Catalog): Promise<void> {
    await prisma.catalog.update({
      where: { id: catalog.id.toString() },
      data: {
        name: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        status: catalog.status as PrismaCatalogStatus,
        coverImageFileId: catalog.coverImageFileId,
        assignedToUserId: catalog.assignedToUserId?.toString() ?? null,
        rules: catalog.rules ?? undefined,
        layout: catalog.layout as PrismaCatalogLayout,
        showPrices: catalog.showPrices,
        showStock: catalog.showStock,
        isPublic: catalog.isPublic,
        deletedAt: catalog.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.catalog.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
