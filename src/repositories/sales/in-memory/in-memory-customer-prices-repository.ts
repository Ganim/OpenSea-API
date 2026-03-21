import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CustomerPrice } from '@/entities/sales/customer-price';
import type {
  CreateCustomerPriceSchema,
  CustomerPricesRepository,
  FindManyCustomerPricesParams,
  UpdateCustomerPriceSchema,
} from '../customer-prices-repository';
import type { PaginatedResult } from '@/repositories/pagination-params';

export class InMemoryCustomerPricesRepository
  implements CustomerPricesRepository
{
  public items: CustomerPrice[] = [];

  async create(data: CreateCustomerPriceSchema): Promise<CustomerPrice> {
    const customerPrice = CustomerPrice.create({
      tenantId: new UniqueEntityID(data.tenantId),
      customerId: new UniqueEntityID(data.customerId),
      variantId: new UniqueEntityID(data.variantId),
      price: data.price,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      notes: data.notes,
      createdByUserId: new UniqueEntityID(data.createdByUserId),
    });

    this.items.push(customerPrice);
    return customerPrice;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CustomerPrice | null> {
    const item = this.items.find(
      (cp) =>
        cp.id.equals(id) && cp.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCustomerAndVariant(
    customerId: string,
    variantId: string,
    tenantId: string,
  ): Promise<CustomerPrice | null> {
    const item = this.items.find(
      (cp) =>
        cp.customerId.toString() === customerId &&
        cp.variantId.toString() === variantId &&
        cp.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findManyByCustomer(
    params: FindManyCustomerPricesParams,
  ): Promise<PaginatedResult<CustomerPrice>> {
    const filtered = this.items.filter(
      (cp) =>
        cp.tenantId.toString() === params.tenantId &&
        cp.customerId.toString() === params.customerId,
    );
    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);
    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async update(
    data: UpdateCustomerPriceSchema,
  ): Promise<CustomerPrice | null> {
    const idx = this.items.findIndex(
      (cp) =>
        cp.id.equals(data.id) && cp.tenantId.toString() === data.tenantId,
    );
    if (idx === -1) return null;
    const item = this.items[idx];
    if (data.price !== undefined) item.price = data.price;
    if (data.validFrom !== undefined) item.validFrom = data.validFrom;
    if (data.validUntil !== undefined) item.validUntil = data.validUntil;
    if (data.notes !== undefined) item.notes = data.notes;
    return item;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    this.items = this.items.filter(
      (cp) => !(cp.id.equals(id) && cp.tenantId.toString() === tenantId),
    );
  }
}
