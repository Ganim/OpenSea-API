import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Item } from '@/entities/stock/item';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { prisma } from '@/lib/prisma';
import type { ItemStatus as PrismaItemStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreateItemSchema,
  ItemsRepository,
  UpdateItemSchema,
} from '../items-repository';

export class PrismaItemsRepository implements ItemsRepository {
  async create(data: CreateItemSchema): Promise<Item> {
    const itemData = await prisma.item.create({
      data: {
        uniqueCode: data.uniqueCode,
        variantId: data.variantId.toString(),
        locationId: data.locationId.toString(),
        initialQuantity: new Decimal(data.initialQuantity),
        currentQuantity: new Decimal(data.currentQuantity),
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
        uniqueCode: itemData.uniqueCode,
        variantId: new EntityID(itemData.variantId),
        locationId: new EntityID(itemData.locationId),
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
        uniqueCode: itemData.uniqueCode,
        variantId: new EntityID(itemData.variantId),
        locationId: new EntityID(itemData.locationId),
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
        uniqueCode: itemData.uniqueCode,
        variantId: new EntityID(itemData.variantId),
        locationId: new EntityID(itemData.locationId),
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

  async findManyByVariant(variantId: UniqueEntityID): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        variantId: variantId.toString(),
        deletedAt: null,
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode,
          variantId: new EntityID(itemData.variantId),
          locationId: new EntityID(itemData.locationId),
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

  async findManyByLocation(locationId: UniqueEntityID): Promise<Item[]> {
    const items = await prisma.item.findMany({
      where: {
        locationId: locationId.toString(),
        deletedAt: null,
      },
    });

    return items.map((itemData) =>
      Item.create(
        {
          uniqueCode: itemData.uniqueCode,
          variantId: new EntityID(itemData.variantId),
          locationId: new EntityID(itemData.locationId),
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
          uniqueCode: itemData.uniqueCode,
          variantId: new EntityID(itemData.variantId),
          locationId: new EntityID(itemData.locationId),
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
          uniqueCode: itemData.uniqueCode,
          variantId: new EntityID(itemData.variantId),
          locationId: new EntityID(itemData.locationId),
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
          uniqueCode: itemData.uniqueCode,
          variantId: new EntityID(itemData.variantId),
          locationId: new EntityID(itemData.locationId),
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
          uniqueCode: itemData.uniqueCode,
          variantId: new EntityID(itemData.variantId),
          locationId: new EntityID(itemData.locationId),
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

  async update(data: UpdateItemSchema): Promise<Item | null> {
    const itemData = await prisma.item.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        locationId: data.locationId?.toString(),
        currentQuantity: data.currentQuantity
          ? new Decimal(data.currentQuantity)
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
        uniqueCode: itemData.uniqueCode,
        variantId: new EntityID(itemData.variantId),
        locationId: new EntityID(itemData.locationId),
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
        locationId: item.locationId.toString(),
        currentQuantity: new Decimal(item.currentQuantity),
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
