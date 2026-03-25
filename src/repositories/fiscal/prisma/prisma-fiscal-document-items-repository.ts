import { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import type { FiscalDocumentItemsRepository } from '../fiscal-document-items-repository';

function toNumber(value: unknown): number {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }
  return value as number;
}

function toDomain(raw: Record<string, unknown>): FiscalDocumentItem {
  return FiscalDocumentItem.create(
    {
      id: new UniqueEntityID(raw.id as string),
      fiscalDocumentId: new UniqueEntityID(raw.fiscalDocumentId as string),
      itemNumber: raw.itemNumber as number,
      productId: raw.productId
        ? new UniqueEntityID(raw.productId as string)
        : undefined,
      productName: raw.productName as string,
      productCode: (raw.productCode as string) ?? '',
      ncm: (raw.ncm as string) ?? '',
      cest: (raw.cest as string) ?? undefined,
      cfop: raw.cfop as string,
      quantity: toNumber(raw.quantity),
      unitPrice: toNumber(raw.unitPrice),
      totalPrice: toNumber(raw.totalPrice),
      discount: toNumber(raw.discount),
      cst: (raw.cst as string) ?? '',
      icmsBase: toNumber(raw.icmsBase),
      icmsRate: toNumber(raw.icmsRate),
      icmsValue: toNumber(raw.icmsValue),
      ipiBase: toNumber(raw.ipiBase),
      ipiRate: toNumber(raw.ipiRate),
      ipiValue: toNumber(raw.ipiValue),
      pisBase: toNumber(raw.pisBase),
      pisRate: toNumber(raw.pisRate),
      pisValue: toNumber(raw.pisValue),
      cofinsBase: toNumber(raw.cofinsBase),
      cofinsRate: toNumber(raw.cofinsRate),
      cofinsValue: toNumber(raw.cofinsValue),
      ibsRate: toNumber(raw.ibsRate),
      ibsValue: toNumber(raw.ibsValue),
      cbsRate: toNumber(raw.cbsRate),
      cbsValue: toNumber(raw.cbsValue),
      createdAt: raw.createdAt as Date,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaFiscalDocumentItemsRepository
  implements FiscalDocumentItemsRepository
{
  async findByDocumentId(documentId: string): Promise<FiscalDocumentItem[]> {
    const itemRecords = await prisma.fiscalDocumentItem.findMany({
      where: { fiscalDocumentId: documentId },
      orderBy: { itemNumber: 'asc' },
    });

    return itemRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );
  }

  async createMany(items: FiscalDocumentItem[]): Promise<void> {
    await prisma.fiscalDocumentItem.createMany({
      data: items.map((item) => ({
        id: item.id.toString(),
        fiscalDocumentId: item.fiscalDocumentId.toString(),
        itemNumber: item.itemNumber,
        productId: item.productId?.toString() ?? null,
        productName: item.productName,
        productCode: item.productCode || null,
        ncm: item.ncm || null,
        cest: item.cest ?? null,
        cfop: item.cfop,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        discount: item.discount,
        cst: item.cst || null,
        icmsBase: item.icmsBase,
        icmsRate: item.icmsRate,
        icmsValue: item.icmsValue,
        ipiBase: item.ipiBase,
        ipiRate: item.ipiRate,
        ipiValue: item.ipiValue,
        pisBase: item.pisBase,
        pisRate: item.pisRate,
        pisValue: item.pisValue,
        cofinsBase: item.cofinsBase,
        cofinsRate: item.cofinsRate,
        cofinsValue: item.cofinsValue,
        ibsRate: item.ibsRate,
        ibsValue: item.ibsValue,
        cbsRate: item.cbsRate,
        cbsValue: item.cbsValue,
        createdAt: item.createdAt,
      })),
    });
  }
}
