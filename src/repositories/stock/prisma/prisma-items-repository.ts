import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
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
  uniqueCode: string;
  variantId: string;
  binId: string | null;
  initialQuantity: Prisma.Decimal;
  currentQuantity: Prisma.Decimal;
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
    product: {
      code: string | null;
      name: string;
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
      productCode: itemData.variant.product.code,
      productName: itemData.variant.product.name,
      variantSku: itemData.variant.sku,
      variantName: itemData.variant.name,
      binId: itemData.bin?.id,
      binAddress: itemData.bin?.address,
      zoneId: itemData.bin?.zone.id,
      zoneWarehouseId: itemData.bin?.zone.warehouseId,
      zoneCode: itemData.bin?.zone.code,
      zoneName: itemData.bin?.zone.name,
    };
  }

  private createItemEntity(itemData: ItemWithRelations): Item {
    return Item.create(
      {
        uniqueCode: itemData.uniqueCode ?? undefined,
        variantId: new EntityID(itemData.variantId),
        binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
        initialQuantity: itemData.initialQuantity.toNumber(),
        currentQuantity: itemData.currentQuantity.toNumber(),
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

  async findAllWithRelations(): Promise<ItemWithRelationsDTO[]> {
    const items = await prisma.item.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
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
  ): Promise<ItemWithRelationsDTO[]> {
    const items = await prisma.item.findMany({
      where: {
        variantId: variantId.toString(),
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
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
  ): Promise<ItemWithRelationsDTO[]> {
    const items = await prisma.item.findMany({
      where: {
        variant: {
          productId: productId.toString(),
        },
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
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
  ): Promise<ItemWithRelationsDTO[]> {
    const items = await prisma.item.findMany({
      where: {
        binId: binId.toString(),
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
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
        uniqueCode: data.uniqueCode,
        fullCode: data.fullCode,
        sequentialCode: data.sequentialCode,
        variantId: data.variantId.toString(),
        binId: data.binId?.toString() ?? null,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.currentQuantity,
        status: data.status.value as PrismaItemStatus,
        entryDate: data.entryDate,
        attributes: data.attributes as object,
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
      },
    });

    return Item.create(
      {
        uniqueCode: itemData.uniqueCode ?? undefined,
        fullCode: itemData.fullCode ?? undefined,
        sequentialCode: itemData.sequentialCode ?? undefined,
        variantId: new EntityID(itemData.variantId),
        binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
        initialQuantity: itemData.initialQuantity.toNumber(),
        currentQuantity: itemData.currentQuantity.toNumber(),
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

  async findById(id: UniqueEntityID): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!itemData) return null;

    return Item.create(
      {
        uniqueCode: itemData.uniqueCode ?? undefined,
        variantId: new EntityID(itemData.variantId),
        binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
        initialQuantity: itemData.initialQuantity.toNumber(),
        currentQuantity: itemData.currentQuantity.toNumber(),
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

  async findByIdWithRelations(
    id: UniqueEntityID,
  ): Promise<ItemWithRelationsDTO | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
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

  async findByUniqueCode(uniqueCode: string): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        uniqueCode,
        deletedAt: null,
      },
    });

    if (!itemData) return null;

    return Item.create(
      {
        uniqueCode: itemData.uniqueCode ?? undefined,
        variantId: new EntityID(itemData.variantId),
        binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
        initialQuantity: itemData.initialQuantity.toNumber(),
        currentQuantity: itemData.currentQuantity.toNumber(),
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

  async findAll(): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode ?? undefined,
          variantId: new EntityID(itemData.variantId),
          binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
          initialQuantity: itemData.initialQuantity.toNumber(),
          currentQuantity: itemData.currentQuantity.toNumber(),
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
      ),
    );
  }

  async findManyByVariant(variantId: UniqueEntityID): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        variantId: variantId.toString(),
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode ?? undefined,
          variantId: new EntityID(itemData.variantId),
          binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
          initialQuantity: itemData.initialQuantity.toNumber(),
          currentQuantity: itemData.currentQuantity.toNumber(),
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
      ),
    );
  }

  async findManyByProduct(productId: UniqueEntityID): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        variant: {
          productId: productId.toString(),
        },
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode ?? undefined,
          variantId: new EntityID(itemData.variantId),
          binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
          initialQuantity: itemData.initialQuantity.toNumber(),
          currentQuantity: itemData.currentQuantity.toNumber(),
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
      ),
    );
  }

  async findManyByBin(binId: UniqueEntityID): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        binId: binId.toString(),
        deletedAt: null,
      },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
        bin: {
          include: {
            zone: true,
          },
        },
      },
    });

    return items.map((itemData) => {
      const itemWithRelations = itemData as ItemWithRelations;
      return Item.create(
        {
          uniqueCode: itemWithRelations.uniqueCode,
          variantId: new EntityID(itemWithRelations.variantId),
          binId: itemWithRelations.binId
            ? new EntityID(itemWithRelations.binId)
            : undefined,
          initialQuantity: itemWithRelations.initialQuantity.toNumber(),
          currentQuantity: itemWithRelations.currentQuantity.toNumber(),
          status: ItemStatus.create(itemWithRelations.status),
          entryDate: itemWithRelations.entryDate,
          attributes: itemWithRelations.attributes as Record<string, unknown>,
          batchNumber: itemWithRelations.batchNumber ?? undefined,
          manufacturingDate: itemWithRelations.manufacturingDate ?? undefined,
          expiryDate: itemWithRelations.expiryDate ?? undefined,
          createdAt: itemWithRelations.createdAt,
          updatedAt: itemWithRelations.updatedAt,
          deletedAt: itemWithRelations.deletedAt ?? undefined,
        },
        new EntityID(itemWithRelations.id),
      );
    });
  }

  async findManyByStatus(status: ItemStatus): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        status: status.value as PrismaItemStatus,
        deletedAt: null,
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode ?? undefined,
          variantId: new EntityID(itemData.variantId),
          binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
          initialQuantity: itemData.initialQuantity.toNumber(),
          currentQuantity: itemData.currentQuantity.toNumber(),
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
      ),
    );
  }

  async findManyByBatch(batchNumber: string): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        batchNumber,
        deletedAt: null,
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode ?? undefined,
          variantId: new EntityID(itemData.variantId),
          binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
          initialQuantity: itemData.initialQuantity.toNumber(),
          currentQuantity: itemData.currentQuantity.toNumber(),
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
      ),
    );
  }

  async findManyExpiring(daysUntilExpiry: number): Promise<Item[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysUntilExpiry);

    const items = await prisma.item.findMany({
      where: {
        expiryDate: {
          lte: targetDate,
          gt: new Date(),
        },
        deletedAt: null,
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode ?? undefined,
          variantId: new EntityID(itemData.variantId),
          binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
          initialQuantity: itemData.initialQuantity.toNumber(),
          currentQuantity: itemData.currentQuantity.toNumber(),
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
      ),
    );
  }

  async findManyExpired(): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        expiryDate: {
          lt: new Date(),
        },
        deletedAt: null,
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode ?? undefined,
          fullCode: itemData.fullCode ?? undefined,
          sequentialCode: itemData.sequentialCode ?? undefined,
          variantId: new EntityID(itemData.variantId),
          binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
          initialQuantity: itemData.initialQuantity.toNumber(),
          currentQuantity: itemData.currentQuantity.toNumber(),
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
      ),
    );
  }

  async findLastByVariantId(variantId: UniqueEntityID): Promise<Item | null> {
    const itemData = await prisma.item.findFirst({
      where: {
        variantId: variantId.toString(),
        deletedAt: null,
      },
      orderBy: {
        sequentialCode: 'desc',
      },
    });

    if (!itemData) {
      return null;
    }

    return Item.create(
      {
        uniqueCode: itemData.uniqueCode ?? undefined,
        fullCode: itemData.fullCode ?? undefined,
        sequentialCode: itemData.sequentialCode ?? undefined,
        variantId: new EntityID(itemData.variantId),
        binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
        initialQuantity: itemData.initialQuantity.toNumber(),
        currentQuantity: itemData.currentQuantity.toNumber(),
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

  async update(data: UpdateItemSchema): Promise<Item | null> {
    const itemData = await prisma.item.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        binId: data.binId?.toString() ?? undefined,
        currentQuantity: data.currentQuantity
          ? data.currentQuantity
          : undefined,
        status: data.status?.value as PrismaItemStatus | undefined,
        attributes: data.attributes as object | undefined,
        batchNumber: data.batchNumber,
        manufacturingDate: data.manufacturingDate,
        expiryDate: data.expiryDate,
      },
    });

    return Item.create(
      {
        uniqueCode: itemData.uniqueCode ?? undefined,
        variantId: new EntityID(itemData.variantId),
        binId: itemData.binId ? new EntityID(itemData.binId) : undefined,
        initialQuantity: itemData.initialQuantity.toNumber(),
        currentQuantity: itemData.currentQuantity.toNumber(),
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

  async save(item: Item): Promise<void> {
    await prisma.item.update({
      where: {
        id: item.id.toString(),
      },
      data: {
        binId: item.binId?.toString() ?? null,
        currentQuantity: item.currentQuantity,
        status: item.status.value as PrismaItemStatus,
        attributes: item.attributes as object,
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
}
