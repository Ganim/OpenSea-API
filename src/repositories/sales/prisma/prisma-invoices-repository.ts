import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Invoice } from '@/entities/sales/invoice';
import { prisma } from '@/lib/prisma';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyInvoicesPaginatedParams,
  InvoicesRepository,
} from '@/repositories/sales/invoices-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToDomain(data: any): Invoice {
  return Invoice.create(
    {
      tenantId: new EntityID(data.tenantId),
      orderId: new EntityID(data.orderId),
      type: data.type,
      number: data.number,
      series: data.series,
      accessKey: data.accessKey,
      focusIdRef: data.focusIdRef ?? undefined,
      status: data.status,
      statusDetails: data.statusDetails ?? undefined,
      xmlUrl: data.xmlUrl ?? undefined,
      pdfUrl: data.pdfUrl ?? undefined,
      xmlContent: data.xmlContent ?? undefined,
      xmlContentHash: data.xmlContentHash ?? undefined,
      issuedAt: data.issuedAt ?? undefined,
      cancelledAt: data.cancelledAt ?? undefined,
      cancelReason: data.cancelReason ?? undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt ?? undefined,
      deletedAt: data.deletedAt ?? undefined,
    },
    new EntityID(data.id),
  );
}

export class PrismaInvoicesRepository implements InvoicesRepository {
  async create(invoice: Invoice): Promise<void> {
    await prisma.invoice.create({
      data: {
        id: invoice.id.toString(),
        tenantId: invoice.tenantId.toString(),
        orderId: invoice.orderId.toString(),
        type: invoice.type,
        number: invoice.number,
        series: invoice.series,
        accessKey: invoice.accessKey,
        focusIdRef: invoice.focusIdRef,
        status: invoice.status,
        statusDetails: invoice.statusDetails,
        xmlUrl: invoice.xmlUrl,
        pdfUrl: invoice.pdfUrl,
        xmlContent: invoice.xmlContent,
        xmlContentHash: invoice.xmlContentHash,
        issuedAt: invoice.issuedAt,
        cancelledAt: invoice.cancelledAt,
        cancelReason: invoice.cancelReason,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt,
        deletedAt: invoice.deletedAt,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Invoice | null> {
    const data = await prisma.invoice.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!data || data.deletedAt) {
      return null;
    }

    return mapToDomain(data);
  }

  async findByAccessKey(
    accessKey: string,
    tenantId: string,
  ): Promise<Invoice | null> {
    const data = await prisma.invoice.findFirst({
      where: {
        accessKey,
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) {
      return null;
    }

    return mapToDomain(data);
  }

  async findByTenantAndNumber(
    tenantId: string,
    number: string,
    series: string,
  ): Promise<Invoice | null> {
    const data = await prisma.invoice.findFirst({
      where: {
        tenantId,
        number,
        series,
        deletedAt: null,
      },
    });

    if (!data) {
      return null;
    }

    return mapToDomain(data);
  }

  async findByOrderId(
    orderId: UniqueEntityID,
    tenantId: string,
  ): Promise<Invoice | null> {
    const data = await prisma.invoice.findFirst({
      where: {
        orderId: orderId.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!data) {
      return null;
    }

    return mapToDomain(data);
  }

  async listByTenant(
    params: FindManyInvoicesPaginatedParams,
  ): Promise<PaginatedResult<Invoice>> {
    const where: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.filters?.status) {
      where.status = params.filters.status;
    }

    if (params.filters?.orderId) {
      where.orderId = params.filters.orderId;
    }

    if (params.filters?.fromDate || params.filters?.toDate) {
      where.createdAt = {};
      if (params.filters?.fromDate) {
        (where.createdAt as Record<string, unknown>).gte =
          params.filters.fromDate;
      }
      if (params.filters?.toDate) {
        (where.createdAt as Record<string, unknown>).lte =
          params.filters.toDate;
      }
    }

    const total = await prisma.invoice.count({ where });

    const data = await prisma.invoice.findMany({
      where,
      take: params.limit,
      skip: (params.page - 1) * params.limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: data.map(mapToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async updateStatus(
    id: UniqueEntityID,
    status: 'PENDING' | 'ISSUED' | 'CANCELLED' | 'ERROR',
    details?: string,
  ): Promise<void> {
    await prisma.invoice.update({
      where: { id: id.toString() },
      data: {
        status,
        statusDetails: details,
        updatedAt: new Date(),
      },
    });
  }

  async save(invoice: Invoice): Promise<void> {
    await prisma.invoice.update({
      where: { id: invoice.id.toString() },
      data: {
        status: invoice.status,
        statusDetails: invoice.statusDetails,
        xmlUrl: invoice.xmlUrl,
        pdfUrl: invoice.pdfUrl,
        xmlContent: invoice.xmlContent,
        xmlContentHash: invoice.xmlContentHash,
        issuedAt: invoice.issuedAt,
        cancelledAt: invoice.cancelledAt,
        cancelReason: invoice.cancelReason,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.invoice.update({
      where: {
        id: id.toString(),
        tenantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
