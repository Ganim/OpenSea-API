import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/generated/client.js';
import type { MovementType as PrismaMovementType } from '@prisma/generated/client.js';
import type {
  CreateItemMovementSchema,
  ItemMovementsRepository,
  UpdateItemMovementSchema,
} from '../item-movements-repository';

export class PrismaItemMovementsRepository implements ItemMovementsRepository {
  async create(data: CreateItemMovementSchema): Promise<ItemMovement> {
    const movementData = await prisma.itemMovement.create({
      data: {
        tenantId: data.tenantId,
        itemId: data.itemId.toString(),
        userId: data.userId.toString(),
        quantity: data.quantity,
        quantityBefore: data.quantityBefore,
        quantityAfter: data.quantityAfter,
        movementType: data.movementType.value as PrismaMovementType,
        reasonCode: data.reasonCode,
        originRef: data.originRef,
        destinationRef: data.destinationRef,
        batchNumber: data.batchNumber,
        notes: data.notes,
        salesOrderId: data.salesOrderId?.toString(),
      },
    });

    return ItemMovement.create(
      {
        tenantId: new EntityID(movementData.tenantId),
        itemId: new EntityID(movementData.itemId),
        userId: new EntityID(movementData.userId),
        quantity: movementData.quantity.toNumber(),
        quantityBefore: movementData.quantityBefore?.toNumber(),
        quantityAfter: movementData.quantityAfter?.toNumber(),
        movementType: MovementType.create(movementData.movementType),
        reasonCode: movementData.reasonCode ?? undefined,
        originRef: movementData.originRef ?? undefined,
        destinationRef: movementData.destinationRef ?? undefined,
        batchNumber: movementData.batchNumber ?? undefined,
        notes: movementData.notes ?? undefined,
        approvedBy: movementData.approvedBy
          ? new EntityID(movementData.approvedBy)
          : undefined,
        salesOrderId: movementData.salesOrderId
          ? new EntityID(movementData.salesOrderId)
          : undefined,
        createdAt: movementData.createdAt,
      },
      new EntityID(movementData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement | null> {
    const movementData = await prisma.itemMovement.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!movementData) return null;

    return ItemMovement.create(
      {
        tenantId: new EntityID(movementData.tenantId),
        itemId: new EntityID(movementData.itemId),
        userId: new EntityID(movementData.userId),
        quantity: movementData.quantity.toNumber(),
        quantityBefore: movementData.quantityBefore?.toNumber(),
        quantityAfter: movementData.quantityAfter?.toNumber(),
        movementType: MovementType.create(movementData.movementType),
        reasonCode: movementData.reasonCode ?? undefined,
        originRef: movementData.originRef ?? undefined,
        destinationRef: movementData.destinationRef ?? undefined,
        batchNumber: movementData.batchNumber ?? undefined,
        notes: movementData.notes ?? undefined,
        approvedBy: movementData.approvedBy
          ? new EntityID(movementData.approvedBy)
          : undefined,
        salesOrderId: movementData.salesOrderId
          ? new EntityID(movementData.salesOrderId)
          : undefined,
        createdAt: movementData.createdAt,
      },
      new EntityID(movementData.id),
    );
  }

  async findAll(tenantId: string): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          tenantId: new EntityID(movementData.tenantId),
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
          originRef: movementData.originRef ?? undefined,
          destinationRef: movementData.destinationRef ?? undefined,
          batchNumber: movementData.batchNumber ?? undefined,
          notes: movementData.notes ?? undefined,
          approvedBy: movementData.approvedBy
            ? new EntityID(movementData.approvedBy)
            : undefined,
          salesOrderId: movementData.salesOrderId
            ? new EntityID(movementData.salesOrderId)
            : undefined,
          createdAt: movementData.createdAt,
        },
        new EntityID(movementData.id),
      ),
    );
  }

  async findManyByItem(
    itemId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        itemId: itemId.toString(),
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          tenantId: new EntityID(movementData.tenantId),
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
          originRef: movementData.originRef ?? undefined,
          destinationRef: movementData.destinationRef ?? undefined,
          batchNumber: movementData.batchNumber ?? undefined,
          notes: movementData.notes ?? undefined,
          approvedBy: movementData.approvedBy
            ? new EntityID(movementData.approvedBy)
            : undefined,
          salesOrderId: movementData.salesOrderId
            ? new EntityID(movementData.salesOrderId)
            : undefined,
          createdAt: movementData.createdAt,
        },
        new EntityID(movementData.id),
      ),
    );
  }

  async findManyByUser(
    userId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        userId: userId.toString(),
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          tenantId: new EntityID(movementData.tenantId),
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
          originRef: movementData.originRef ?? undefined,
          destinationRef: movementData.destinationRef ?? undefined,
          batchNumber: movementData.batchNumber ?? undefined,
          notes: movementData.notes ?? undefined,
          approvedBy: movementData.approvedBy
            ? new EntityID(movementData.approvedBy)
            : undefined,
          salesOrderId: movementData.salesOrderId
            ? new EntityID(movementData.salesOrderId)
            : undefined,
          createdAt: movementData.createdAt,
        },
        new EntityID(movementData.id),
      ),
    );
  }

  async findManyByType(
    movementType: MovementType,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        movementType: movementType.value as PrismaMovementType,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          tenantId: new EntityID(movementData.tenantId),
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
          originRef: movementData.originRef ?? undefined,
          destinationRef: movementData.destinationRef ?? undefined,
          batchNumber: movementData.batchNumber ?? undefined,
          notes: movementData.notes ?? undefined,
          approvedBy: movementData.approvedBy
            ? new EntityID(movementData.approvedBy)
            : undefined,
          salesOrderId: movementData.salesOrderId
            ? new EntityID(movementData.salesOrderId)
            : undefined,
          createdAt: movementData.createdAt,
        },
        new EntityID(movementData.id),
      ),
    );
  }

  async findManyByBatch(
    batchNumber: string,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        batchNumber,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          tenantId: new EntityID(movementData.tenantId),
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
          originRef: movementData.originRef ?? undefined,
          destinationRef: movementData.destinationRef ?? undefined,
          batchNumber: movementData.batchNumber ?? undefined,
          notes: movementData.notes ?? undefined,
          approvedBy: movementData.approvedBy
            ? new EntityID(movementData.approvedBy)
            : undefined,
          salesOrderId: movementData.salesOrderId
            ? new EntityID(movementData.salesOrderId)
            : undefined,
          createdAt: movementData.createdAt,
        },
        new EntityID(movementData.id),
      ),
    );
  }

  async findManyBySalesOrder(
    salesOrderId: UniqueEntityID,
    tenantId: string,
  ): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        salesOrderId: salesOrderId.toString(),
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          tenantId: new EntityID(movementData.tenantId),
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
          originRef: movementData.originRef ?? undefined,
          destinationRef: movementData.destinationRef ?? undefined,
          batchNumber: movementData.batchNumber ?? undefined,
          notes: movementData.notes ?? undefined,
          approvedBy: movementData.approvedBy
            ? new EntityID(movementData.approvedBy)
            : undefined,
          salesOrderId: movementData.salesOrderId
            ? new EntityID(movementData.salesOrderId)
            : undefined,
          createdAt: movementData.createdAt,
        },
        new EntityID(movementData.id),
      ),
    );
  }

  async findManyPendingApproval(tenantId: string): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        approvedBy: null,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          tenantId: new EntityID(movementData.tenantId),
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
          originRef: movementData.originRef ?? undefined,
          destinationRef: movementData.destinationRef ?? undefined,
          batchNumber: movementData.batchNumber ?? undefined,
          notes: movementData.notes ?? undefined,
          approvedBy: movementData.approvedBy
            ? new EntityID(movementData.approvedBy)
            : undefined,
          salesOrderId: movementData.salesOrderId
            ? new EntityID(movementData.salesOrderId)
            : undefined,
          createdAt: movementData.createdAt,
        },
        new EntityID(movementData.id),
      ),
    );
  }

  async update(data: UpdateItemMovementSchema): Promise<ItemMovement | null> {
    const movementData = await prisma.itemMovement.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        reasonCode: data.reasonCode,
        destinationRef: data.destinationRef,
        notes: data.notes,
        approvedBy: data.approvedBy?.toString(),
      },
    });

    return ItemMovement.create(
      {
        tenantId: new EntityID(movementData.tenantId),
        itemId: new EntityID(movementData.itemId),
        userId: new EntityID(movementData.userId),
        quantity: movementData.quantity.toNumber(),
        quantityBefore: movementData.quantityBefore?.toNumber(),
        quantityAfter: movementData.quantityAfter?.toNumber(),
        movementType: MovementType.create(movementData.movementType),
        reasonCode: movementData.reasonCode ?? undefined,
        originRef: movementData.originRef ?? undefined,
        destinationRef: movementData.destinationRef ?? undefined,
        batchNumber: movementData.batchNumber ?? undefined,
        notes: movementData.notes ?? undefined,
        approvedBy: movementData.approvedBy
          ? new EntityID(movementData.approvedBy)
          : undefined,
        salesOrderId: movementData.salesOrderId
          ? new EntityID(movementData.salesOrderId)
          : undefined,
        createdAt: movementData.createdAt,
      },
      new EntityID(movementData.id),
    );
  }

  async save(movement: ItemMovement): Promise<void> {
    await prisma.itemMovement.update({
      where: {
        id: movement.id.toString(),
      },
      data: {
        reasonCode: movement.reasonCode,
        destinationRef: movement.destinationRef,
        notes: movement.notes,
        approvedBy: movement.approvedBy?.toString(),
      },
    });
  }

  async createBatchForZoneReconfigure(data: {
    tenantId: string;
    items: Array<{
      itemId: string;
      binAddress: string;
      currentQuantity: number;
    }>;
    userId: string;
    notes?: string;
  }): Promise<number> {
    const movements = data.items.map((item) => ({
      tenantId: data.tenantId,
      itemId: item.itemId,
      userId: data.userId,
      quantity: new Prisma.Decimal(item.currentQuantity),
      quantityBefore: new Prisma.Decimal(item.currentQuantity),
      quantityAfter: new Prisma.Decimal(item.currentQuantity),
      movementType: 'ZONE_RECONFIGURE' as const,
      originRef: `Bin: ${item.binAddress}`,
      reasonCode: 'ZONE_RECONFIGURE',
      notes: data.notes ?? null,
    }));

    const result = await prisma.itemMovement.createMany({ data: movements });
    return result.count;
  }
}
