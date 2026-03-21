import type { PriceTableItem } from '@/entities/sales/price-table-item';

export interface PriceTableItemDTO {
  id: string;
  priceTableId: string;
  tenantId: string;
  variantId: string;
  price: number;
  minQuantity: number;
  maxQuantity: number | null;
  costPrice: number | null;
  marginPercent: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function priceTableItemToDTO(item: PriceTableItem): PriceTableItemDTO {
  return {
    id: item.id.toString(),
    priceTableId: item.priceTableId.toString(),
    tenantId: item.tenantId.toString(),
    variantId: item.variantId.toString(),
    price: item.price,
    minQuantity: item.minQuantity,
    maxQuantity: item.maxQuantity ?? null,
    costPrice: item.costPrice ?? null,
    marginPercent: item.marginPercent ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? null,
  };
}
