import {
  FiscalDocument,
  type FiscalDocumentStatus,
  type FiscalDocumentType,
  type EmissionType,
} from '@/entities/fiscal/fiscal-document';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import {
  FiscalDocumentType as PrismaFiscalDocumentType,
  FiscalDocumentStatus as PrismaFiscalDocumentStatus,
  FiscalEmissionType as PrismaFiscalEmissionType,
} from '@prisma/generated/client.js';
import type {
  FiscalDocumentsRepository,
  FiscalDocumentFilters,
} from '../fiscal-documents-repository';

function toDomain(raw: Record<string, unknown>): FiscalDocument {
  return FiscalDocument.create(
    {
      id: new UniqueEntityID(raw.id as string),
      tenantId: new UniqueEntityID(raw.tenantId as string),
      configId: new UniqueEntityID(raw.configId as string),
      type: raw.type as FiscalDocumentType,
      series: raw.series as number,
      number: raw.number as number,
      accessKey: (raw.accessKey as string) ?? undefined,
      status: raw.status as FiscalDocumentStatus,
      emissionType: raw.emissionType as EmissionType,
      recipientCnpjCpf: (raw.recipientCnpjCpf as string) ?? '',
      recipientName: (raw.recipientName as string) ?? '',
      recipientIe: (raw.recipientIe as string) ?? undefined,
      naturezaOperacao: (raw.naturezaOperacao as string) ?? '',
      cfop: (raw.cfop as string) ?? '',
      totalProducts:
        raw.totalProducts instanceof Prisma.Decimal
          ? raw.totalProducts.toNumber()
          : (raw.totalProducts as number),
      totalDiscount:
        raw.totalDiscount instanceof Prisma.Decimal
          ? raw.totalDiscount.toNumber()
          : (raw.totalDiscount as number),
      totalShipping:
        raw.totalShipping instanceof Prisma.Decimal
          ? raw.totalShipping.toNumber()
          : (raw.totalShipping as number),
      totalTax:
        raw.totalTax instanceof Prisma.Decimal
          ? raw.totalTax.toNumber()
          : (raw.totalTax as number),
      totalValue:
        raw.totalValue instanceof Prisma.Decimal
          ? raw.totalValue.toNumber()
          : (raw.totalValue as number),
      xmlSent: (raw.xmlSent as string) ?? undefined,
      xmlAuthorized: (raw.xmlAuthorized as string) ?? undefined,
      xmlCancellation: (raw.xmlCancellation as string) ?? undefined,
      danfePdfUrl: (raw.danfePdfUrl as string) ?? undefined,
      protocolNumber: (raw.protocolNumber as string) ?? undefined,
      protocolDate: (raw.protocolDate as Date) ?? undefined,
      externalId: (raw.externalId as string) ?? undefined,
      orderId: raw.orderId
        ? new UniqueEntityID(raw.orderId as string)
        : undefined,
      cancelledAt: (raw.cancelledAt as Date) ?? undefined,
      cancelReason: (raw.cancelReason as string) ?? undefined,
      correctionText: (raw.correctionText as string) ?? undefined,
      additionalInfo: (raw.additionalInfo as string) ?? undefined,
      createdAt: raw.createdAt as Date,
      updatedAt: (raw.updatedAt as Date) ?? undefined,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaFiscalDocumentsRepository
  implements FiscalDocumentsRepository
{
  async findById(id: string): Promise<FiscalDocument | null> {
    const documentRecord = await prisma.fiscalDocument.findUnique({
      where: { id },
    });

    return documentRecord
      ? toDomain(documentRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByAccessKey(accessKey: string): Promise<FiscalDocument | null> {
    const documentRecord = await prisma.fiscalDocument.findUnique({
      where: { accessKey },
    });

    return documentRecord
      ? toDomain(documentRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByTenantId(
    tenantId: string,
    params: FiscalDocumentFilters,
  ): Promise<{ documents: FiscalDocument[]; total: number }> {
    const { page, limit, type, status, startDate, endDate } = params;

    const where: Prisma.FiscalDocumentWhereInput = { tenantId };

    if (type) {
      where.type = type as unknown as PrismaFiscalDocumentType;
    }

    if (status) {
      where.status = status as unknown as PrismaFiscalDocumentStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [documentRecords, total] = await Promise.all([
      prisma.fiscalDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fiscalDocument.count({ where }),
    ]);

    const documents = documentRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );

    return { documents, total };
  }

  async findNextNumber(
    configId: string,
    type: string,
    series: number,
  ): Promise<number> {
    const maxNumberResult = await prisma.fiscalDocument.aggregate({
      where: {
        configId,
        type: type as unknown as PrismaFiscalDocumentType,
        series,
      },
      _max: { number: true },
    });

    return (maxNumberResult._max.number ?? 0) + 1;
  }

  async create(document: FiscalDocument): Promise<void> {
    await prisma.fiscalDocument.create({
      data: {
        id: document.id.toString(),
        tenantId: document.tenantId.toString(),
        configId: document.configId.toString(),
        type: document.type as unknown as PrismaFiscalDocumentType,
        series: document.series,
        number: document.number,
        accessKey: document.accessKey ?? null,
        status: document.status as unknown as PrismaFiscalDocumentStatus,
        emissionType:
          document.emissionType as unknown as PrismaFiscalEmissionType,
        recipientCnpjCpf: document.recipientCnpjCpf || null,
        recipientName: document.recipientName || null,
        recipientIe: document.recipientIe ?? null,
        naturezaOperacao: document.naturezaOperacao || null,
        cfop: document.cfop || null,
        totalProducts: document.totalProducts,
        totalDiscount: document.totalDiscount,
        totalShipping: document.totalShipping,
        totalTax: document.totalTax,
        totalValue: document.totalValue,
        xmlSent: document.xmlSent ?? null,
        xmlAuthorized: document.xmlAuthorized ?? null,
        xmlCancellation: document.xmlCancellation ?? null,
        danfePdfUrl: document.danfePdfUrl ?? null,
        protocolNumber: document.protocolNumber ?? null,
        protocolDate: document.protocolDate ?? null,
        externalId: document.externalId ?? null,
        orderId: document.orderId?.toString() ?? null,
        cancelledAt: document.cancelledAt ?? null,
        cancelReason: document.cancelReason ?? null,
        correctionText: document.correctionText ?? null,
        additionalInfo: document.additionalInfo ?? null,
        createdAt: document.createdAt,
      },
    });
  }

  async save(document: FiscalDocument): Promise<void> {
    await prisma.fiscalDocument.update({
      where: { id: document.id.toString() },
      data: {
        accessKey: document.accessKey ?? null,
        status: document.status as unknown as PrismaFiscalDocumentStatus,
        xmlSent: document.xmlSent ?? null,
        xmlAuthorized: document.xmlAuthorized ?? null,
        xmlCancellation: document.xmlCancellation ?? null,
        danfePdfUrl: document.danfePdfUrl ?? null,
        protocolNumber: document.protocolNumber ?? null,
        protocolDate: document.protocolDate ?? null,
        externalId: document.externalId ?? null,
        cancelledAt: document.cancelledAt ?? null,
        cancelReason: document.cancelReason ?? null,
        correctionText: document.correctionText ?? null,
      },
    });
  }
}
