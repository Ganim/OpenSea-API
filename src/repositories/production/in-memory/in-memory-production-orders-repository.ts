import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionOrderStatus } from '@/entities/production/production-order';
import { ProductionOrder } from '@/entities/production/production-order';
import type {
  ProductionOrdersRepository,
  CreateProductionOrderSchema,
  UpdateProductionOrderSchema,
} from '../production-orders-repository';

export class InMemoryProductionOrdersRepository
  implements ProductionOrdersRepository
{
  public items: ProductionOrder[] = [];

  async create(data: CreateProductionOrderSchema): Promise<ProductionOrder> {
    const order = ProductionOrder.create({
      tenantId: new EntityID(data.tenantId),
      orderNumber: data.orderNumber,
      bomId: new EntityID(data.bomId),
      productId: new EntityID(data.productId),
      salesOrderId: data.salesOrderId ? new EntityID(data.salesOrderId) : null,
      parentOrderId: data.parentOrderId
        ? new EntityID(data.parentOrderId)
        : null,
      status: (data.status ?? 'DRAFT') as ProductionOrderStatus,
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
      releasedById: data.releasedById ? new EntityID(data.releasedById) : null,
      notes: data.notes ?? null,
      createdById: new EntityID(data.createdById),
    });

    this.items.push(order);
    return order;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionOrder | null> {
    const item = this.items.find(
      (i) => i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByOrderNumber(
    orderNumber: string,
    tenantId: string,
  ): Promise<ProductionOrder | null> {
    const item = this.items.find(
      (i) =>
        i.orderNumber.toLowerCase() === orderNumber.toLowerCase() &&
        i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(
    tenantId: string,
    options?: { page?: number; limit?: number },
  ): Promise<ProductionOrder[]> {
    const filtered = this.items.filter(
      (i) => i.tenantId.toString() === tenantId,
    );

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const start = (page - 1) * limit;

    return filtered.slice(start, start + limit);
  }

  async findManyByStatus(
    tenantId: string,
    status: string,
  ): Promise<ProductionOrder[]> {
    return this.items.filter(
      (i) => i.tenantId.toString() === tenantId && i.status === status,
    );
  }

  async getNextOrderNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OP-${year}-`;

    const tenantOrders = this.items.filter(
      (i) =>
        i.tenantId.toString() === tenantId && i.orderNumber.startsWith(prefix),
    );

    let maxNumber = 0;
    for (const order of tenantOrders) {
      const numStr = order.orderNumber.replace(prefix, '');
      const num = parseInt(numStr, 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }

    return `${prefix}${String(maxNumber + 1).padStart(5, '0')}`;
  }

  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const filtered = this.items.filter(
      (i) => i.tenantId.toString() === tenantId,
    );

    const result: Record<string, number> = {};
    for (const order of filtered) {
      result[order.status] = (result[order.status] ?? 0) + 1;
    }

    return result;
  }

  async update(
    data: UpdateProductionOrderSchema,
  ): Promise<ProductionOrder | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.orderNumber !== undefined) item.orderNumber = data.orderNumber;
    if (data.bomId !== undefined) item.bomId = new EntityID(data.bomId);
    if (data.productId !== undefined)
      item.productId = new EntityID(data.productId);
    if (data.salesOrderId !== undefined)
      item.salesOrderId = data.salesOrderId
        ? new EntityID(data.salesOrderId)
        : null;
    if (data.parentOrderId !== undefined)
      item.parentOrderId = data.parentOrderId
        ? new EntityID(data.parentOrderId)
        : null;
    if (data.status !== undefined) item.status = data.status;
    if (data.priority !== undefined) item.priority = data.priority;
    if (data.quantityPlanned !== undefined)
      item.quantityPlanned = data.quantityPlanned;
    if (data.quantityStarted !== undefined)
      item.quantityStarted = data.quantityStarted;
    if (data.quantityCompleted !== undefined)
      item.quantityCompleted = data.quantityCompleted;
    if (data.quantityScrapped !== undefined)
      item.quantityScrapped = data.quantityScrapped;
    if (data.plannedStartDate !== undefined)
      item.plannedStartDate = data.plannedStartDate;
    if (data.plannedEndDate !== undefined)
      item.plannedEndDate = data.plannedEndDate;
    if (data.actualStartDate !== undefined)
      item.actualStartDate = data.actualStartDate;
    if (data.actualEndDate !== undefined)
      item.actualEndDate = data.actualEndDate;
    if (data.notes !== undefined) item.notes = data.notes;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
