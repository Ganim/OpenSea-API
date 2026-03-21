import type { PriceTable } from '@/entities/sales/price-table';

export interface PriceTableDTO {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: string;
  currency: string;
  priceIncludesTax: boolean;
  isDefault: boolean;
  priority: number;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function priceTableToDTO(priceTable: PriceTable): PriceTableDTO {
  return {
    id: priceTable.id.toString(),
    tenantId: priceTable.tenantId.toString(),
    name: priceTable.name,
    description: priceTable.description ?? null,
    type: priceTable.type,
    currency: priceTable.currency,
    priceIncludesTax: priceTable.priceIncludesTax,
    isDefault: priceTable.isDefault,
    priority: priceTable.priority,
    isActive: priceTable.isActive,
    validFrom: priceTable.validFrom ?? null,
    validUntil: priceTable.validUntil ?? null,
    createdAt: priceTable.createdAt,
    updatedAt: priceTable.updatedAt ?? null,
  };
}
