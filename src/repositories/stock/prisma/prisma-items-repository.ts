import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import {
  Prisma,
  type ItemStatus as PrismaItemStatus,
  type MovementType as PrismaMovementType,
} from '@prisma/generated/client.js';

import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  CreateItemSchema,
  ItemListFilters,
  ItemsRepository,
  ItemWithRelationsDTO,
  UpdateItemSchema,
} from '../items-repository';

export interface ItemWithRelations {
  id: string;
  tenantId: string;
  uniqueCode: string;
  slug: string;
  fullCode: string;
  sequentialCode: number;
  barcode: string;
  eanCode: string;
  upcCode: string;
  qrCode: string | null;
  variantId: string;
  binId: string | null;
  lastKnownAddress: string | null;
  initialQuantity: Prisma.Decimal;
  currentQuantity: Prisma.Decimal;
  unitCost: Prisma.Decimal | null;
  status: PrismaItemStatus;
  entryDate: Date;
  attributes: object;
  batchNumber: string | null;
  manufacturingDate: Date | null;
  expiryDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  variant: {
    sku: string;
    name: string;
    reference: string | null;
    colorHex: string | null;
    secondaryColorHex: string | null;
    pattern: string | null;
    attributes: object;
    product: {
      id: string;
      fullCode: string | null;
      name: string;
      templateId: string | null;
      attributes: object;
      template: {
        name: string;
        unitOfMeasure: string;
        productAttributes: object;
        variantAttributes: object;
        itemAttributes: object;
      } | null;
      manufacturer: {
        name: string;
      } | null;
    };
  };
  bin?: {
    id: string;
    address: string;
    zone: {
      id: string;
      warehouseId: string;
      code: string;
      name: string;
    };
  } | null;
}

// ItemWithRelationsDTO is imported from items-repository.ts

export class PrismaItemsRepository implements ItemsRepository {
  private extractRelatedData(itemData: ItemWithRelations) {
    return {
      productCode: itemData.variant.product.fullCode,
      productName: itemData.variant.product.name,
      variantSku: itemData.variant.sku,
      variantName: itemData.variant.name,
      variantReference: itemData.variant.reference ?? null,
      binId: itemData.bin?.id,
      binAddress: itemData.bin?.address,
      zoneId: itemData.bin?.zone.id,
      zoneWarehouseId: itemData.bin?.zone.warehouseId,
      zoneCode: itemData.bin?.zone.code,
      zoneName: itemData.bin?.zone.name,
      templateId: itemData.variant.product.templateId ?? undefined,
      templateName: itemData.variant.product.template?.name,
      templateUnitOfMeasure: itemData.variant.product.template?.unitOfMeasure,
      productAttributes: itemData.variant.product.attributes as Record<
        string,
        unknown
      >,
      variantAttributes: itemData.variant.attributes as Record<string, unknown>,
      variantColorHex: itemData.variant.colorHex ?? undefined,
      variantSecondaryColorHex: itemData.variant.secondaryColorHex ?? undefined,
      variantPattern: itemData.variant.pattern ?? undefined,
      manufacturerName: itemData.variant.product.manufacturer?.name,
      productId: itemData.variant.product.id,
      templateProductAttributes: itemData.variant.product.template
        ?.productAttributes as Record<string, unknown> | undefined,
      templateVariantAttributes: itemData.variant.product.template
        ?.variantAttributes as Record<string, unknown> | undefined,
      templateItemAttributes: itemData.variant.product.template
        ?.itemAttributes as Record<string, unknown> | undefined,
    };
  }

  private createItemEntity(itemData: ItemWithRelations): Item {
    return this.toDomainItem(itemData);
  }

  private toDomainItem(itemData: {
    id: string;
    tenantId: string;
    uniqueCode: string | null;
    slug: string;
    fullCode: string;
    sequentialCode: number;
    barcode: string;
    eanCode: string;
    upcCode: string;
    qrCode?: string | null;
    variantId: string;
    binId: string | null;
    lastKnownAddress?: string | null;
    initialQuantity: Prisma.Decimal;
    currentQuantity: Prisma.Decimal;
    unitCost?: Prisma.Decimal | null;
    status: PrismaItemStatus;
    entryDate: Date;
    attributes: unknown;
    batchNumber: string | null;
    manufacturingDate: Date | null;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): Item {
    return Item.create(
      {
        tenantId: new EntityID(itemData.tenantId),
        uniqueCode: itemData.uniqueCode ?? undefined,
        slug: Slug.create(itemData.slug),
        fullCode: itemData.fullCode,
        sequentialCode: itemData.sequentialCode,
        barcode: itemData.barcode,
        eanCode: itemData.eanCode,
        upcCode: itemData.upcCode,
        qrCode: itemData.qrCode ?? undefined,
        variantId: new EntityID(itemData.variantId),
        binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
        lastKnownAddress: itemData.lastKnownAddress ?? undefined,
        initialQuantity: itemData.initialQuantity.toNumber(),
        currentQuantity: itemData.currentQuantity.toNumber(),
        unitCost: itemData.unitCost?.toNumber(),
        status: ItemStatus.create(itemData.status),
        entryDate: itemData.entryDate,
        attributes: itemData.attributes as Record<string, unknown>,
        batchNumber: itemData.batchNumber ?? undefined,
        manufacturingDate: itemData.manufacturingDate ?? undefined,
        expiryDate: itemData.expiryDate ?? undefined,
        exitMovementType: (itemData as Record<string, unknown>)
          .exitMovementType as string | undefined,
        createdAt: itemData.createdAt,
        updatedAt: itemData.updatedAt,
        deletedAt: itemData.deletedAt ?? undefined,
      },
      new EntityID(itemData.id),
    );
  }

  private readonly itemRelationsInclude = {
    variant: {
      include: {
        product: {
          include: { template: true, manufacturer: true },
        },
      },
    },
    bin: {
      include: {
        zone: true,
      },
    },
  } as const;

  async findAllWithRelationsPaginated(
    tenantId: string,
    params: PaginationParams,
    filters?: ItemListFilters,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>> {
    const where: Prisma.ItemWhereInput = { tenantId, deletedAt: null };

    if (filters?.status) {
      where.status = filters.status as PrismaItemStatus;
    }

    if (filters?.hideEmpty) {
      where.currentQuantity = { gt: 0 };
    }

    if (filters?.manufacturerId) {
      where.variant = {
        ...((where.variant as Prisma.VariantWhereInput) ?? {}),
        product: {
          manufacturerId: filters.manufacturerId,
        },
      };
    }

    if (filters?.zoneId) {
      where.bin = {
        zone: {
          id: filters.zoneId,
        },
      };
    }

    if (filters?.updatedFrom || filters?.updatedTo) {
      where.updatedAt = {
        ...(filters.updatedFrom ? { gte: filters.updatedFrom } : {}),
        ...(filters.updatedTo ? { lte: filters.updatedTo } : {}),
      };
    }

    if (filters?.search) {
      const searchTerm = filters.search;
      where.OR = [
        { fullCode: { contains: searchTerm, mode: 'insensitive' } },
        { uniqueCode: { contains: searchTerm, mode: 'insensitive' } },
        { batchNumber: { contains: searchTerm, mode: 'insensitive' } },
        {
          variant: {
            name: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        {
          variant: {
            sku: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        {
          variant: {
            reference: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        {
          variant: {
            product: {
              name: { contains: searchTerm, mode: 'insensitive' },
            },
          },
        },
        {
          variant: {
            product: {
              template: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        },
        {
          variant: {
            product: {
              manufacturer: {
                name: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        },
        {
          bin: {
            address: { contains: searchTerm, mode: 'insensitive' },
          },
        },
      ];
    }

    const orderBy = this.buildOrderBy(filters?.sortBy, filters?.sortOrder);

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: this.itemRelationsInclude,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.item.count({ where }),
    ]);

    return {
      data: items.map((itemData) => ({
        item: this.createItemEntity(itemData as ItemWithRelations),
        relatedData: this.extractRelatedData(itemData as ItemWithRelations),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  private buildOrderBy(
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Prisma.ItemOrderByWithRelationInput {
    const direction = sortOrder ?? 'desc';

    switch (sortBy) {
      case 'name':
        return { variant: { product: { name: direction } } };
      case 'fullCode':
        return { fullCode: direction };
      case 'currentQuantity':
        return { currentQuantity: direction };
      case 'entryDate':
        return { entryDate: direction };
      case 'manufacturerName':
        return { variant: { product: { manufacturer: { name: direction } } } };
      case 'binAddress':
        return { bin: { address: direction } };
      case 'createdAt':
        return { createdAt: direction };
      default:
        return { createdAt: 'desc' };
    }
  }

  async findManyByVariantWithRelations(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]> {
    const items = await prisma.item.findMany({
      where: {
        variantId: variantId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: this.itemRelationsInclude,
    });

    return items.map((itemData) => ({
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    }));
  }

  async findManyByVariantWithRelationsPaginated(
    variantId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>> {
    const where = {
      variantId: variantId.toString(),
      tenantId,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: this.itemRelationsInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.item.count({ where }),
    ]);

    return {
      data: items.map((itemData) => ({
        item: this.createItemEntity(itemData as ItemWithRelations),
        relatedData: this.extractRelatedData(itemData as ItemWithRelations),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByProductWithRelations(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]> {
    const items = await prisma.item.findMany({
      where: {
        variant: { productId: productId.toString() },
        tenantId,
        deletedAt: null,
      },
      include: this.itemRelationsInclude,
    });

    return items.map((itemData) => ({
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    }));
  }

  async findManyByProductWithRelationsPaginated(
    productId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>> {
    const where = {
      variant: { productId: productId.toString() },
      tenantId,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: this.itemRelationsInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.item.count({ where }),
    ]);

    return {
      data: items.map((itemData) => ({
        item: this.createItemEntity(itemData as ItemWithRelations),
        relatedData: this.extractRelatedData(itemData as ItemWithRelations),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByBinWithRelations(
    binId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]> {
    const items = await prisma.item.findMany({
      where: {
        binId: binId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: this.itemRelationsInclude,
    });

    return items.map((itemData) => ({
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    }));
  }

  async findManyByBinWithRelationsPaginated(
    binId: UniqueEntityID,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>> {
    const where = {
      binId: binId.toString(),
      tenantId,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: this.itemRelationsInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.item.count({ where }),
    ]);

    return {
      data: items.map((itemData) => ({
        item: this.createItemEntity(itemData as ItemWithRelations),
        relatedData: this.extractRelatedData(itemData as ItemWithRelations),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findManyByBatchWithRelationsPaginated(
    batchNumber: string,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<ItemWithRelationsDTO>> {
    const where = {
      batchNumber,
      tenantId,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: this.itemRelationsInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.item.count({ where }),
    ]);

    return {
      data: items.map((itemData) => ({
        item: this.createItemEntity(itemData as ItemWithRelations),
        relatedData: this.extractRelatedData(itemData as ItemWithRelations),
      })),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async create(data: CreateItemSchema): Promise<Item> {
    const itemData = await prisma.item.create({
      data: {
        tenantId: data.tenantId,
        uniqueCode: data.uniqueCode,
        slug: data.slug.value,
        fullCode: data.fullCode,
        sequentialCode: data.sequentialCode,
        barcode: data.barcode,
        eanCode: data.eanCode,
        upcCode: data.upcCode,
        variantId: data.variantId.toString(),
        binId: data.binId?.toString() ?? null,
        lastKnownAddress: data.lastKnownAddress ?? null,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.currentQuantity,
        unitCost: data.unitCost,
        status: data.status.value as PrismaItemStatus,
        entryDate: data.entryDate,
        attributes: (data.attributes ?? {}) as Prisma.InputJsonValue,
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
      },
    });

    return this.toDomainItem(itemData);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!itemData) return null;

    return this.toDomainItem(itemData);
  }

  async findManyByIds(
    ids: UniqueEntityID[],
    tenantId: string,
  ): Promise<Item[]> {
    if (ids.length === 0) return [];

    const items = await prisma.item.findMany({
      where: {
        id: { in: ids.map((id) => id.toString()) },
        tenantId,
        deletedAt: null,
      },
    });

    return items.map((item) => this.toDomainItem(item));
  }

  async findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: {
              include: { template: true, manufacturer: true },
            },
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    if (!itemData) return null;

    return {
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    };
  }

  async findByUniqueCode(
    uniqueCode: string,
    tenantId: string,
  ): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        uniqueCode,
        tenantId,
        deletedAt: null,
      },
    });

    if (!itemData) return null;

    return this.toDomainItem(itemData);
  }

  async findByFullCode(
    fullCode: string,
    tenantId: string,
  ): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: { fullCode, tenantId, deletedAt: null },
    });
    if (!itemData) return null;
    return this.toDomainItem(itemData);
  }

  async findByBarcode(barcode: string, tenantId: string): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: { barcode, tenantId, deletedAt: null },
    });
    if (!itemData) return null;
    return this.toDomainItem(itemData);
  }

  async findByEanCode(eanCode: string, tenantId: string): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: { eanCode, tenantId, deletedAt: null },
    });
    if (!itemData) return null;
    return this.toDomainItem(itemData);
  }

  async findByUpcCode(upcCode: string, tenantId: string): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: { upcCode, tenantId, deletedAt: null },
    });
    if (!itemData) return null;
    return this.toDomainItem(itemData);
  }

  async findByAnyCode(code: string, tenantId: string): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { fullCode: code },
          { barcode: code },
          { eanCode: code },
          { upcCode: code },
          { uniqueCode: code },
        ],
      },
    });
    if (!itemData) return null;
    return this.toDomainItem(itemData);
  }

  async findAll(tenantId: string): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: {
              include: { template: true, manufacturer: true },
            },
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) => this.toDomainItem(itemData));
  }

  async countByVariantId(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    return prisma.item.count({
      where: {
        variantId: variantId.toString(),
        tenantId,
        deletedAt: null,
      },
    });
  }

  async findManyByVariant(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        variantId: variantId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: {
              include: { template: true, manufacturer: true },
            },
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) => this.toDomainItem(itemData));
  }

  async findManyByProduct(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        variant: {
          productId: productId.toString(),
        },
        tenantId,
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: {
              include: { template: true, manufacturer: true },
            },
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) => this.toDomainItem(itemData));
  }

  async findManyByBin(
    binId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        binId: binId.toString(),
        tenantId,
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: {
              include: { template: true, manufacturer: true },
            },
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) => this.toDomainItem(itemData));
  }

  async findManyByBatch(
    batchNumber: string,
    tenantId: string,
  ): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        batchNumber,
        tenantId,
        deletedAt: null,
      },
    });

    return items.map((itemData) => this.toDomainItem(itemData));
  }

  async findLastByVariantId(
    variantId: UniqueEntityID,
    tenantId: string,
  ): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        variantId: variantId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: {
        sequentialCode: 'desc',
      },
    });

    if (!itemData) {
      return null;
    }

    return this.toDomainItem(itemData);
  }

  async update(data: UpdateItemSchema): Promise<Item | null> {
    const itemData = await prisma.item.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        binId: data.binId?.toString() ?? undefined,
        lastKnownAddress: data.lastKnownAddress ?? undefined,
        currentQuantity: data.currentQuantity
          ? data.currentQuantity
          : undefined,
        status: data.status?.value as PrismaItemStatus | undefined,
        attributes: data.attributes as Prisma.InputJsonValue,
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
      },
    });

    return this.toDomainItem(itemData);
  }

  async save(item: Item, tx?: TransactionClient): Promise<void> {
    const client = tx ?? prisma;
    await client.item.update({
      where: {
        id: item.id.toString(),
      },
      data: {
        binId: item.binId?.toString() ?? null,
        lastKnownAddress: item.lastKnownAddress ?? null,
        currentQuantity: item.currentQuantity,
        status: item.status.value as PrismaItemStatus,
        attributes: item.attributes as Prisma.InputJsonValue,
        batchNumber: item.batchNumber,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate,
        exitMovementType: (item.exitMovementType as PrismaMovementType) ?? null,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,
      },
    });
  }

  async atomicDecrement(
    id: UniqueEntityID,
    quantity: number,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<Item> {
    const client = tx ?? prisma;
    const itemData = await client.item.update({
      where: {
        id: id.toString(),
        tenantId,
      },
      data: {
        currentQuantity: { decrement: quantity },
      },
    });

    return this.toDomainItem(itemData);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.item.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async detachItemsFromBins(
    binIds: string[],
    tenantId: string,
  ): Promise<number> {
    if (binIds.length === 0) return 0;

    // Single UPDATE with JOIN to set lastKnownAddress from bin address and detach in one query
    const result = await prisma.$executeRaw`
      UPDATE items
      SET last_known_address = COALESCE(bins.address, items.last_known_address),
          bin_id = NULL,
          updated_at = NOW()
      FROM bins
      WHERE items.bin_id = bins.id
        AND items.bin_id::text = ANY(${binIds})
        AND items.tenant_id = ${tenantId}
        AND items.deleted_at IS NULL
    `;

    return result;
  }
}
