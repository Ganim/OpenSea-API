import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OrderItem } from '@/entities/sales/order-item';
import { prisma } from '@/lib/prisma';
import { orderItemPrismaToDomain } from '@/mappers/sales/order-item/order-item-prisma-to-domain';
import type { OrderItemsRepository } from '../order-items-repository';
import type { PriceSourceType as PrismaPriceSource } from '@prisma/generated/client.js';

export class PrismaOrderItemsRepository implements OrderItemsRepository {
  async create(item: OrderItem): Promise<void> {
    await prisma.orderItem.create({
      data: this.toPrisma(item),
    });
  }

  async createMany(items: OrderItem[]): Promise<void> {
    if (items.length === 0) return;
    await prisma.orderItem.createMany({
      data: items.map((item) => this.toPrisma(item)),
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderItem | null> {
    const data = await prisma.orderItem.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!data) return null;
    return orderItemPrismaToDomain(data);
  }

  async findManyByOrder(
    orderId: UniqueEntityID,
    tenantId: string,
  ): Promise<OrderItem[]> {
    const items = await prisma.orderItem.findMany({
      where: {
        orderId: orderId.toString(),
        tenantId,
      },
      orderBy: { position: 'asc' },
    });

    return items.map((i) => orderItemPrismaToDomain(i));
  }

  async save(item: OrderItem): Promise<void> {
    await prisma.orderItem.update({
      where: { id: item.id.toString() },
      data: {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountValue: item.discountValue,
        subtotal: item.subtotal,
        quantityDelivered: item.quantityDelivered,
        quantityReturned: item.quantityReturned,
        position: item.position,
        notes: item.notes ?? null,
      },
    });
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.orderItem.delete({
      where: { id: id.toString() },
    });
  }

  async deleteByOrder(
    orderId: UniqueEntityID,
    _tenantId: string,
  ): Promise<void> {
    await prisma.orderItem.deleteMany({
      where: { orderId: orderId.toString() },
    });
  }

  private toPrisma(item: OrderItem) {
    return {
      id: item.id.toString(),
      tenantId: item.tenantId.toString(),
      orderId: item.orderId.toString(),
      variantId: item.variantId?.toString() ?? null,
      comboId: item.comboId?.toString() ?? null,
      name: item.name,
      sku: item.sku ?? null,
      description: item.description ?? null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      discountValue: item.discountValue,
      subtotal: item.subtotal,
      taxIcms: item.taxIcms,
      taxIpi: item.taxIpi,
      taxPis: item.taxPis,
      taxCofins: item.taxCofins,
      taxTotal: item.taxTotal,
      ncm: item.ncm ?? null,
      cfop: item.cfop ?? null,
      quantityDelivered: item.quantityDelivered,
      quantityReturned: item.quantityReturned,
      priceSource: item.priceSource as PrismaPriceSource,
      priceSourceId: item.priceSourceId ?? null,
      position: item.position,
      notes: item.notes ?? null,
      createdAt: item.createdAt,
    };
  }
}
