import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { prisma } from '@/lib/prisma';
import {
  Prisma,
  type ItemStatus as PrismaItemStatus,
} from '@prisma/generated/client.js';

import type {
  CreateItemSchema,
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
    colorHex: string | null;
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
      binId: itemData.bin?.id,
      binAddress: itemData.bin?.address,
      zoneId: itemData.bin?.zone.id,
      zoneWarehouseId: itemData.bin?.zone.warehouseId,
      zoneCode: itemData.bin?.zone.code,
      zoneName: itemData.bin?.zone.name,
      templateId: itemData.variant.product.templateId ?? undefined,
      templateName: itemData.variant.product.template?.name,
      templateUnitOfMeasure: itemData.variant.product.template?.unitOfMeasure,
      productAttributes: itemData.variant.product.attributes as Record<string, unknown>,
      variantAttributes: itemData.variant.attributes as Record<string, unknown>,
      variantColorHex: itemData.variant.colorHex ?? undefined,
      manufacturerName: itemData.variant.product.manufacturer?.name,
      productId: itemData.variant.product.id,
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
        createdAt: itemData.createdAt,
        updatedAt: itemData.updatedAt,
        deletedAt: itemData.deletedAt ?? undefined,
      },
      new EntityID(itemData.id),
    );
  }

  async findAllWithRelations(
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]> {
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

    return items.map((itemData) => ({
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    }));
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

    return items.map((itemData) => ({
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    }));
  }

  async findManyByProductWithRelations(
    productId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemWithRelationsDTO[]> {
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

    return items.map((itemData) => ({
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    }));
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

    return items.map((itemData) => ({
      item: this.createItemEntity(itemData as ItemWithRelations),
      relatedData: this.extractRelatedData(itemData as ItemWithRelations),
    }));
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

  async findManyByStatus(
    status: ItemStatus,
    tenantId: string,
  ): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        status: status.value as PrismaItemStatus,
        tenantId,
        deletedAt: null,
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

  async findManyExpiring(
    daysUntilExpiry: number,
    tenantId: string,
  ): Promise<Item[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysUntilExpiry);

    const items = await prisma.item.findMany({
      where: {
        expiryDate: {
          lte: targetDate,
          gt: new Date(),
        },
        tenantId,
        deletedAt: null,
      },
    });

    return items.map((itemData) => this.toDomainItem(itemData));
  }

  async findManyExpired(tenantId: string): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        expiryDate: {
          lt: new Date(),
        },
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

  async save(item: Item): Promise<void> {
    await prisma.item.update({
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
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,
      },
    });
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
    const items = await prisma.item.findMany({
      where: {
        binId: { in: binIds },
        tenantId,
        deletedAt: null,
      },
      include: { bin: { select: { address: true } } },
    });

    if (items.length === 0) return 0;

    for (const item of items) {
      await prisma.item.update({
        where: { id: item.id },
        data: {
          lastKnownAddress: item.bin?.address ?? item.lastKnownAddress,
          binId: null,
        },
      });
    }

    return items.length;
  }
}
