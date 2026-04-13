import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionOrderStatus } from '@/entities/production/production-order';
import { ProductionOrder } from '@/entities/production/production-order';
import { prisma } from '@/lib/prisma';
import type {
  ProductionOrdersRepository,
  CreateProductionOrderSchema,
  UpdateProductionOrderSchema,
} from '../production-orders-repository';

function toDomain(raw: {
  id: string;
  tenantId: string;
  orderNumber: string;
  bomId: string;
  productId: string;
  salesOrderId: string | null;
  parentOrderId: string | null;
  status: string;
  priority: number;
  quantityPlanned: number;
  quantityStarted: number;
  quantityCompleted: number;
  quantityScrapped: number;
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  releasedAt: Date | null;
  releasedById: string | null;
  notes: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}): ProductionOrder {
  return ProductionOrder.create(
    {
      tenantId: new EntityID(raw.tenantId),
      orderNumber: raw.orderNumber,
      bomId: new EntityID(raw.bomId),
      productId: new EntityID(raw.productId),
      salesOrderId: raw.salesOrderId ? new EntityID(raw.salesOrderId) : null,
      parentOrderId: raw.parentOrderId ? new EntityID(raw.parentOrderId) : null,
      status: raw.status as ProductionOrderStatus,
      priority: raw.priority,
      quantityPlanned: raw.quantityPlanned,
      quantityStarted: raw.quantityStarted,
      quantityCompleted: raw.quantityCompleted,
      quantityScrapped: raw.quantityScrapped,
      plannedStartDate: raw.plannedStartDate ?? null,
      plannedEndDate: raw.plannedEndDate ?? null,
      actualStartDate: raw.actualStartDate ?? null,
      actualEndDate: raw.actualEndDate ?? null,
      releasedAt: raw.releasedAt ?? null,
      releasedById: raw.releasedById ? new EntityID(raw.releasedById) : null,
      notes: raw.notes ?? null,
      createdById: new EntityID(raw.createdById),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export class PrismaProductionOrdersRepository
  implements ProductionOrdersRepository
{
  async create(data: CreateProductionOrderSchema): Promise<ProductionOrder> {
    const raw = await prisma.productionOrder.create({
      data: {
        tenantId: data.tenantId,
        orderNumber: data.orderNumber,
        bomId: data.bomId,
        productId: data.productId,
        salesOrderId: data.salesOrderId ?? null,
        parentOrderId: data.parentOrderId ?? null,
        status: data.status ?? 'DRAFT',
        priority: data.priority,
        quantityPlanned: data.quantityPlanned,
        quantityStarted: data.quantityStarted ?? 0,
        quantityCompleted: data.quantityCompleted ?? 0,
        quantityScrapped: data.quantityScrapped ?? 0,
        plannedStartDate: data.plannedStartDate ?? null,
        plannedEndDate: data.plannedEndDate ?? null,
        actualStartDate: data.actualStartDate ?? null,
        actualEndDate: data.actualEndDate ?? null,
        releasedAt: data.releasedAt ?? null,
        releasedById: data.releasedById ?? null,
        notes: data.notes ?? null,
        createdById: data.createdById,
      },
    });

    return toDomain(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOrder | null> {
    const raw = await prisma.productionOrder.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findByOrderNumber(
    orderNumber: string,
    tenantId: string,
  ): Promise<ProductionOrder | null> {
    const raw = await prisma.productionOrder.findFirst({
      where: {
        orderNumber: { equals: orderNumber, mode: 'insensitive' },
        tenantId,
      },
    });

    if (!raw) {
      return null;
    }

    return toDomain(raw);
  }

  async findMany(
    tenantId: string,
    options?: { page?: number; limit?: number },
  ): Promise<ProductionOrder[]> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const records = await prisma.productionOrder.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return records.map(toDomain);
  }

  async findManyByStatus(
    tenantId: string,
    status: string,
  ): Promise<ProductionOrder[]> {
    const records = await prisma.productionOrder.findMany({
      where: {
        tenantId,
        status,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(toDomain);
  }

  async getNextOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OP-${year}-`;

    const lastOrder = await prisma.productionOrder.findFirst({
      where: {
        tenantId,
        orderNumber: { startsWith: prefix },
      },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });

    let nextNumber = 1;

    if (lastOrder) {
      const lastNumberStr = lastOrder.orderNumber.replace(prefix, '');
      const lastNumber = parseInt(lastNumberStr, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const counts = await prisma.productionOrder.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true },
    });

    const result: Record<string, number> = {};
    for (const item of counts) {
      result[item.status] = item._count.status;
    }

    return result;
  }

  async update(
    data: UpdateProductionOrderSchema,
  ): Promise<ProductionOrder | null> {
    const updateData: {
      orderNumber?: string;
      bomId?: string;
      productId?: string;
      salesOrderId?: string | null;
      parentOrderId?: string | null;
      status?: string;
      priority?: number;
      quantityPlanned?: number;
      quantityStarted?: number;
      quantityCompleted?: number;
      quantityScrapped?: number;
      plannedStartDate?: Date | null;
      plannedEndDate?: Date | null;
      actualStartDate?: Date | null;
      actualEndDate?: Date | null;
      releasedAt?: Date | null;
      releasedById?: string | null;
      notes?: string | null;
    } = {};

    if (data.orderNumber !== undefined)
      updateData.orderNumber = data.orderNumber;
    if (data.bomId !== undefined) updateData.bomId = data.bomId;
    if (data.productId !== undefined) updateData.productId = data.productId;
    if (data.salesOrderId !== undefined)
      updateData.salesOrderId = data.salesOrderId;
    if (data.parentOrderId !== undefined)
      updateData.parentOrderId = data.parentOrderId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.quantityPlanned !== undefined)
      updateData.quantityPlanned = data.quantityPlanned;
    if (data.quantityStarted !== undefined)
      updateData.quantityStarted = data.quantityStarted;
    if (data.quantityCompleted !== undefined)
      updateData.quantityCompleted = data.quantityCompleted;
    if (data.quantityScrapped !== undefined)
      updateData.quantityScrapped = data.quantityScrapped;
    if (data.plannedStartDate !== undefined)
      updateData.plannedStartDate = data.plannedStartDate;
    if (data.plannedEndDate !== undefined)
      updateData.plannedEndDate = data.plannedEndDate;
    if (data.actualStartDate !== undefined)
      updateData.actualStartDate = data.actualStartDate;
    if (data.actualEndDate !== undefined)
      updateData.actualEndDate = data.actualEndDate;
    if (data.releasedAt !== undefined) updateData.releasedAt = data.releasedAt;
    if (data.releasedById !== undefined)
      updateData.releasedById = data.releasedById;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const raw = await prisma.productionOrder.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return toDomain(raw);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.productionOrder.delete({
      where: { id: id.toString() },
    });
  }
}
