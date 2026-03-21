import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplaceOrder } from '@/entities/sales/marketplace-order';
import type { MarketplaceOrderStatusType } from '@/entities/sales/marketplace-order';
import type {
  CreateMarketplaceOrderSchema,
  MarketplaceOrdersRepository,
} from '../marketplace-orders-repository';

export class InMemoryMarketplaceOrdersRepository
  implements MarketplaceOrdersRepository
{
  public items: MarketplaceOrder[] = [];

  async create(data: CreateMarketplaceOrderSchema): Promise<MarketplaceOrder> {
    const order = MarketplaceOrder.create({
      tenantId: new UniqueEntityID(data.tenantId),
      connectionId: new UniqueEntityID(data.connectionId),
      externalOrderId: data.externalOrderId,
      externalOrderUrl: data.externalOrderUrl,
      status: data.status,
      buyerName: data.buyerName,
      buyerDocument: data.buyerDocument,
      buyerEmail: data.buyerEmail,
      buyerPhone: data.buyerPhone,
      customerId: data.customerId,
      subtotal: data.subtotal,
      shippingCost: data.shippingCost,
      marketplaceFee: data.marketplaceFee,
      netAmount: data.netAmount,
      currency: data.currency,
      shippingMethod: data.shippingMethod,
      deliveryAddress: data.deliveryAddress,
      receivedAt: data.receivedAt,
      notes: data.notes,
    });

    this.items.push(order);
    return order;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<MarketplaceOrder | null> {
    const item = this.items.find(
      (o) =>
        !o.deletedAt && o.id.equals(id) && o.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByExternalId(
    connectionId: string,
    externalOrderId: string,
  ): Promise<MarketplaceOrder | null> {
    const item = this.items.find(
      (o) =>
        !o.deletedAt &&
        o.connectionId.toString() === connectionId &&
        o.externalOrderId === externalOrderId,
    );
    return item ?? null;
  }

  async findManyByConnection(
    connectionId: string,
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<MarketplaceOrder[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (o) =>
          !o.deletedAt &&
          o.connectionId.toString() === connectionId &&
          o.tenantId.toString() === tenantId,
      )
      .slice(start, start + perPage);
  }

  async findManyByTenant(
    page: number,
    perPage: number,
    tenantId: string,
    status?: MarketplaceOrderStatusType,
  ): Promise<MarketplaceOrder[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (o) =>
          !o.deletedAt &&
          o.tenantId.toString() === tenantId &&
          (!status || o.status === status),
      )
      .slice(start, start + perPage);
  }

  async countByConnection(
    connectionId: string,
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (o) =>
        !o.deletedAt &&
        o.connectionId.toString() === connectionId &&
        o.tenantId.toString() === tenantId,
    ).length;
  }

  async countByTenant(
    tenantId: string,
    status?: MarketplaceOrderStatusType,
  ): Promise<number> {
    return this.items.filter(
      (o) =>
        !o.deletedAt &&
        o.tenantId.toString() === tenantId &&
        (!status || o.status === status),
    ).length;
  }

  async save(order: MarketplaceOrder): Promise<void> {
    const index = this.items.findIndex((o) => o.id.equals(order.id));
    if (index >= 0) {
      this.items[index] = order;
    } else {
      this.items.push(order);
    }
  }
}
