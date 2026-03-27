import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Quote } from '@/entities/sales/quote';
import type { QuoteStatus } from '@/entities/sales/quote';
import { prisma } from '@/lib/prisma';
import type { QuoteStatus as PrismaQuoteStatus } from '@prisma/generated/client.js';
import type { CreateQuoteSchema, QuotesRepository } from '../quotes-repository';

function mapToDomain(
  quoteData: Record<string, unknown>,
  quoteItems: Record<string, unknown>[],
): Quote {
  return Quote.create(
    {
      tenantId: new EntityID(quoteData.tenantId as string),
      customerId: new EntityID(quoteData.customerId as string),
      title: quoteData.title as string,
      status: quoteData.status as QuoteStatus,
      validUntil: (quoteData.validUntil as Date) ?? undefined,
      notes: (quoteData.notes as string) ?? undefined,
      subtotal: Number(quoteData.subtotal),
      discount: Number(quoteData.discount),
      total: Number(quoteData.total),
      sentAt: (quoteData.sentAt as Date) ?? undefined,
      viewedAt: (quoteData.viewedAt as Date) ?? undefined,
      viewCount: (quoteData.viewCount as number) ?? 0,
      lastViewedAt: (quoteData.lastViewedAt as Date) ?? undefined,
      createdBy: quoteData.createdBy as string,
      signatureEnvelopeId:
        (quoteData.signatureEnvelopeId as string) ?? undefined,
      isActive: quoteData.isActive as boolean,
      createdAt: quoteData.createdAt as Date,
      updatedAt: quoteData.updatedAt as Date,
      deletedAt: (quoteData.deletedAt as Date) ?? undefined,
      items: quoteItems.map((quoteItem) => ({
        id: new EntityID(quoteItem.id as string),
        quoteId: new EntityID(quoteItem.quoteId as string),
        variantId: (quoteItem.variantId as string) ?? undefined,
        productName: quoteItem.productName as string,
        quantity: quoteItem.quantity as number,
        unitPrice: Number(quoteItem.unitPrice),
        discount: Number(quoteItem.discount),
        total: Number(quoteItem.total),
        createdAt: quoteItem.createdAt as Date,
        updatedAt: (quoteItem.updatedAt as Date) ?? undefined,
      })),
    },
    new EntityID(quoteData.id as string),
  );
}

export class PrismaQuotesRepository implements QuotesRepository {
  async create(data: CreateQuoteSchema): Promise<Quote> {
    const quoteData = await prisma.quote.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        title: data.title,
        validUntil: data.validUntil,
        notes: data.notes,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        createdBy: data.createdBy,
        items: {
          create: data.items.map((quoteItem) => ({
            productName: quoteItem.productName,
            variantId: quoteItem.variantId,
            quantity: quoteItem.quantity,
            unitPrice: quoteItem.unitPrice,
            discount: quoteItem.discount ?? 0,
            total: quoteItem.total,
          })),
        },
      },
      include: { items: true },
    });

    return mapToDomain(
      quoteData as unknown as Record<string, unknown>,
      quoteData.items as unknown as Record<string, unknown>[],
    );
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Quote | null> {
    const quoteData = await prisma.quote.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      include: { items: true },
    });

    if (!quoteData) return null;

    return mapToDomain(
      quoteData as unknown as Record<string, unknown>,
      quoteData.items as unknown as Record<string, unknown>[],
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { status?: QuoteStatus; customerId?: string },
  ): Promise<Quote[]> {
    const quotesData = await prisma.quote.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.status && {
          status: filters.status as PrismaQuoteStatus,
        }),
        ...(filters?.customerId && { customerId: filters.customerId }),
      },
      include: { items: true },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return quotesData.map((quoteData) =>
      mapToDomain(
        quoteData as unknown as Record<string, unknown>,
        quoteData.items as unknown as Record<string, unknown>[],
      ),
    );
  }

  async countMany(
    tenantId: string,
    filters?: { status?: QuoteStatus; customerId?: string },
  ): Promise<number> {
    return prisma.quote.count({
      where: {
        tenantId,
        deletedAt: null,
        ...(filters?.status && {
          status: filters.status as PrismaQuoteStatus,
        }),
        ...(filters?.customerId && { customerId: filters.customerId }),
      },
    });
  }

  async save(quote: Quote): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.quote.update({
        where: { id: quote.id.toString() },
        data: {
          customerId: quote.customerId.toString(),
          title: quote.title,
          status: quote.status as PrismaQuoteStatus,
          validUntil: quote.validUntil ?? null,
          notes: quote.notes ?? null,
          subtotal: quote.subtotal,
          discount: quote.discount,
          total: quote.total,
          sentAt: quote.sentAt ?? null,
          viewedAt: quote.viewedAt ?? null,
          viewCount: quote.viewCount,
          lastViewedAt: quote.lastViewedAt ?? null,
          signatureEnvelopeId: quote.signatureEnvelopeId ?? null,
          isActive: quote.isActive,
          deletedAt: quote.deletedAt ?? null,
        },
      });

      // Replace all items
      await tx.quoteItem.deleteMany({
        where: { quoteId: quote.id.toString() },
      });

      if (quote.items.length > 0) {
        await tx.quoteItem.createMany({
          data: quote.items.map((quoteItem) => ({
            id: quoteItem.id.toString(),
            quoteId: quote.id.toString(),
            variantId: quoteItem.variantId ?? null,
            productName: quoteItem.productName,
            quantity: quoteItem.quantity,
            unitPrice: quoteItem.unitPrice,
            discount: quoteItem.discount,
            total: quoteItem.total,
          })),
        });
      }
    });
  }

  async updateViewTracking(id: string): Promise<boolean> {
    const now = new Date();

    const updatedQuote = await prisma.quote.updateMany({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        viewedAt: now,
        viewCount: { increment: 1 },
        lastViewedAt: now,
      },
    });

    return updatedQuote.count > 0;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.quote.update({
      where: {
        id: id.toString(),
        tenantId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
