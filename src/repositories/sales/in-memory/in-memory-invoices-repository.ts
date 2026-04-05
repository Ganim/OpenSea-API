import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Invoice } from '@/entities/sales/invoice';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyInvoicesPaginatedParams,
  InvoicesRepository,
} from '@/repositories/sales/invoices-repository';

export class InMemoryInvoicesRepository implements InvoicesRepository {
  public items: Invoice[] = [];

  async create(invoice: Invoice): Promise<void> {
    this.items.push(invoice);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Invoice | null> {
    return (
      this.items.find(
        (inv) =>
          inv.id.toString() === id.toString() &&
          inv.tenantId.toString() === tenantId &&
          !inv.isDeleted,
      ) ?? null
    );
  }

  async findByAccessKey(accessKey: string, tenantId: string): Promise<Invoice | null> {
    return (
      this.items.find(
        (inv) =>
          inv.accessKey === accessKey &&
          inv.tenantId.toString() === tenantId &&
          !inv.isDeleted,
      ) ?? null
    );
  }

  async findByTenantAndNumber(
    tenantId: string,
    number: string,
    series: string,
  ): Promise<Invoice | null> {
    return (
      this.items.find(
        (inv) =>
          inv.tenantId.toString() === tenantId &&
          inv.number === number &&
          inv.series === series &&
          !inv.isDeleted,
      ) ?? null
    );
  }

  async findByOrderId(orderId: UniqueEntityID, tenantId: string): Promise<Invoice | null> {
    return (
      this.items.find(
        (inv) =>
          inv.orderId.toString() === orderId.toString() &&
          inv.tenantId.toString() === tenantId &&
          !inv.isDeleted,
      ) ?? null
    );
  }

  async listByTenant(
    params: FindManyInvoicesPaginatedParams,
  ): Promise<PaginatedResult<Invoice>> {
    let filtered = this.items.filter(
      (inv) => inv.tenantId.toString() === params.tenantId && !inv.isDeleted,
    );

    // Apply filters
    if (params.filters?.status) {
      filtered = filtered.filter((inv) => inv.status === params.filters?.status);
    }

    if (params.filters?.orderId) {
      filtered = filtered.filter(
        (inv) => inv.orderId.toString() === params.filters?.orderId,
      );
    }

    if (params.filters?.fromDate) {
      filtered = filtered.filter((inv) => inv.createdAt >= params.filters!.fromDate!);
    }

    if (params.filters?.toDate) {
      const tomorrow = new Date(params.filters.toDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      filtered = filtered.filter((inv) => inv.createdAt < tomorrow);
    }

    // Sort by createdAt DESC
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate
    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      pages: Math.ceil(total / params.limit),
    };
  }

  async updateStatus(
    id: UniqueEntityID,
    status: 'PENDING' | 'ISSUED' | 'CANCELLED' | 'ERROR',
    details?: string,
  ): Promise<void> {
    const invoice = this.items.find((inv) => inv.id.toString() === id.toString());
    if (invoice) {
      invoice.status = status;
      if (details) {
        invoice.statusDetails = details;
      }
    }
  }

  async save(invoice: Invoice): Promise<void> {
    const index = this.items.findIndex((inv) => inv.id.toString() === invoice.id.toString());
    if (index >= 0) {
      this.items[index] = invoice;
    }
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const invoice = this.items.find(
      (inv) =>
        inv.id.toString() === id.toString() &&
        inv.tenantId.toString() === tenantId,
    );
    if (invoice) {
      invoice.deletedAt = new Date();
    }
  }
}
