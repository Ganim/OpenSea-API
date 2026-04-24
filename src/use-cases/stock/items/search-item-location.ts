import { prisma } from '@/lib/prisma';
import { tokenizedSearchAnd } from '@/lib/tokenized-search';

export interface SearchItemLocationRequest {
  tenantId: string;
  query: string;
  limit?: number;
}

export interface ItemLocationResult {
  itemId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  bin: { id: string; address: string } | null;
  warehouse: { id: string; code: string; name: string };
  zone: { id: string; code: string; name: string };
}

export interface SearchItemLocationResponse {
  items: ItemLocationResult[];
}

const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 20;

export class SearchItemLocationUseCase {
  async execute(
    request: SearchItemLocationRequest,
  ): Promise<SearchItemLocationResponse> {
    const { tenantId, query, limit } = request;

    const effectiveLimit = Math.min(
      limit ?? DEFAULT_SEARCH_LIMIT,
      MAX_SEARCH_LIMIT,
    );

    const matchedItems = await prisma.item.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...tokenizedSearchAnd(query, (token) => {
          const like = { contains: token, mode: 'insensitive' as const };
          return {
            OR: [
              { variant: { product: { name: like } } },
              { variant: { name: like } },
              { variant: { sku: like } },
              { barcode: like },
              { eanCode: like },
              { fullCode: like },
            ],
          };
        }),
      },
      include: {
        variant: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
        bin: {
          include: {
            zone: {
              include: {
                warehouse: {
                  select: { id: true, code: true, name: true },
                },
              },
            },
          },
        },
      },
      take: effectiveLimit,
    });

    const itemLocationResults: ItemLocationResult[] = matchedItems
      .filter((item) => {
        // Only include items that have a zone/warehouse link (either via bin or that have location data)
        return item.bin?.zone?.warehouse != null;
      })
      .map((item) => {
        const zone = item.bin!.zone;
        const warehouse = zone.warehouse;

        return {
          itemId: item.id,
          productName: item.variant.product.name,
          variantName: item.variant.name,
          sku: item.variant.sku,
          barcode: item.barcode,
          quantity: Number(item.currentQuantity),
          bin: item.bin ? { id: item.bin.id, address: item.bin.address } : null,
          warehouse: {
            id: warehouse.id,
            code: warehouse.code,
            name: warehouse.name,
          },
          zone: {
            id: zone.id,
            code: zone.code,
            name: zone.name,
          },
        };
      });

    // Also include items without a bin (orphaned) but still matching the search
    const orphanedItems = matchedItems
      .filter((item) => item.bin == null)
      .map((item) => ({
        itemId: item.id,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        sku: item.variant.sku,
        barcode: item.barcode,
        quantity: Number(item.currentQuantity),
        bin: null,
        warehouse: { id: '', code: '', name: '' },
        zone: { id: '', code: '', name: '' },
      }));

    return {
      items: [...itemLocationResults, ...orphanedItems].slice(
        0,
        effectiveLimit,
      ),
    };
  }
}
