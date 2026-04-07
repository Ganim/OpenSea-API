import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Invoice } from '@/entities/sales/invoice';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface ListInvoicesFilters {
  status?: 'PENDING' | 'ISSUED' | 'CANCELLED' | 'ERROR';
  orderId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface FindManyInvoicesPaginatedParams {
  tenantId: string;
  filters?: ListInvoicesFilters;
  page: number;
  limit: number;
}

export interface InvoicesRepository {
  create(invoice: Invoice): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Invoice | null>;
  findByAccessKey(accessKey: string, tenantId: string): Promise<Invoice | null>;
  findByTenantAndNumber(
    tenantId: string,
    number: string,
    series: string,
  ): Promise<Invoice | null>;
  findByOrderId(
    orderId: UniqueEntityID,
    tenantId: string,
  ): Promise<Invoice | null>;
  listByTenant(
    params: FindManyInvoicesPaginatedParams,
  ): Promise<PaginatedResult<Invoice>>;
  updateStatus(
    id: UniqueEntityID,
    status: 'PENDING' | 'ISSUED' | 'CANCELLED' | 'ERROR',
    details?: string,
  ): Promise<void>;
  save(invoice: Invoice): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
