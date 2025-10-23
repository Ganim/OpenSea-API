import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ItemMovement } from '@/entities/stock/item-movement';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { prisma } from '@/lib/prisma';
import type { MovementType as PrismaMovementType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreateItemMovementSchema,
  ItemMovementsRepository,
  UpdateItemMovementSchema,
} from '../item-movements-repository';

export class PrismaItemMovementsRepository implements ItemMovementsRepository {
  async create(data: CreateItemMovementSchema): Promise<ItemMovement> {
    const movementData = await prisma.itemMovement.create({
      data: {
        itemId: data.itemId.toString(),
        userId: data.userId.toString(),
        quantity: new Decimal(data.quantity),
        quantityBefore: data.quantityBefore
          ? new Decimal(data.quantityBefore)
          : undefined,
        quantityAfter: data.quantityAfter
          ? new Decimal(data.quantityAfter)
          : undefined,
        movementType: data.movementType.value as PrismaMovementType,
        reasonCode: data.reasonCode,
        destinationRef: data.destinationRef,
        batchNumber: data.batchNumber,
        notes: data.notes,
        salesOrderId: data.salesOrderId?.toString(),
      },
    });

    return ItemMovement.create(
      {
        itemId: new EntityID(movementData.itemId),
        userId: new EntityID(movementData.userId),
        quantity: movementData.quantity.toNumber(),
        quantityBefore: movementData.quantityBefore?.toNumber(),
        quantityAfter: movementData.quantityAfter?.toNumber(),
        movementType: MovementType.create(movementData.movementType),
        reasonCode: movementData.reasonCode ?? undefined,
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

  async findById(id: UniqueEntityID): Promise<ItemMovement | null> {
    const movementData = await prisma.itemMovement.findUnique({
      where: {
        id: id.toString(),
      },
    });

    if (!movementData) return null;

    return ItemMovement.create(
      {
        itemId: new EntityID(movementData.itemId),
        userId: new EntityID(movementData.userId),
        quantity: movementData.quantity.toNumber(),
        quantityBefore: movementData.quantityBefore?.toNumber(),
        quantityAfter: movementData.quantityAfter?.toNumber(),
        movementType: MovementType.create(movementData.movementType),
        reasonCode: movementData.reasonCode ?? undefined,
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

  async findAll(): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
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

  async findManyByItem(itemId: UniqueEntityID): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        itemId: itemId.toString(),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
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

  async findManyByUser(userId: UniqueEntityID): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        userId: userId.toString(),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
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

  async findManyByType(movementType: MovementType): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        movementType: movementType.value as PrismaMovementType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
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

  async findManyByBatch(batchNumber: string): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        batchNumber,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
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
  ): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        salesOrderId: salesOrderId.toString(),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
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

  async findManyPendingApproval(): Promise<ItemMovement[]> {
    const movements = await prisma.itemMovement.findMany({
      where: {
        approvedBy: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return movements.map((movementData) =>
      ItemMovement.create(
        {
          itemId: new EntityID(movementData.itemId),
          userId: new EntityID(movementData.userId),
          quantity: movementData.quantity.toNumber(),
          quantityBefore: movementData.quantityBefore?.toNumber(),
          quantityAfter: movementData.quantityAfter?.toNumber(),
          movementType: MovementType.create(movementData.movementType),
          reasonCode: movementData.reasonCode ?? undefined,
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
        itemId: new EntityID(movementData.itemId),
        userId: new EntityID(movementData.userId),
        quantity: movementData.quantity.toNumber(),
        quantityBefore: movementData.quantityBefore?.toNumber(),
        quantityAfter: movementData.quantityAfter?.toNumber(),
        movementType: MovementType.create(movementData.movementType),
        reasonCode: movementData.reasonCode ?? undefined,
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
}
