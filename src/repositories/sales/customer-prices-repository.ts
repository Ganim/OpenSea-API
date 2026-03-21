import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CustomerPrice } from '@/entities/sales/customer-price';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface CreateCustomerPriceSchema {
  tenantId: string;
  customerId: string;
  variantId: string;
  price: number;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
  createdByUserId: string;
}

export interface UpdateCustomerPriceSchema {
  id: UniqueEntityID;
  tenantId: string;
  price?: number;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
}

export interface FindManyCustomerPricesParams {
  tenantId: string;
  customerId: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerPricesRepository {
  create(data: CreateCustomerPriceSchema): Promise<CustomerPrice>;
  findById(id: UniqueEntityID, tenantId: string): Promise<CustomerPrice | null>;
  findByCustomerAndVariant(
    customerId: string,
    variantId: string,
    tenantId: string,
  ): Promise<CustomerPrice | null>;
  findManyByCustomer(params: FindManyCustomerPricesParams): Promise<PaginatedResult<CustomerPrice>>;
  update(data: UpdateCustomerPriceSchema): Promise<CustomerPrice | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
