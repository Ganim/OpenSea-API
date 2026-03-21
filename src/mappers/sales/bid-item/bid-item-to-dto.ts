import type { BidItem } from '@/entities/sales/bid-item';

export interface BidItemDTO {
  id: string;
  tenantId: string;
  bidId: string;
  itemNumber: number;
  lotNumber: number | null;
  lotDescription: string | null;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number | null;
  ourUnitPrice: number | null;
  finalUnitPrice: number | null;
  status: string;
  variantId: string | null;
  matchConfidence: number | null;
  quotaType: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function bidItemToDTO(item: BidItem): BidItemDTO {
  return {
    id: item.id.toString(),
    tenantId: item.tenantId.toString(),
    bidId: item.bidId.toString(),
    itemNumber: item.itemNumber,
    lotNumber: item.lotNumber ?? null,
    lotDescription: item.lotDescription ?? null,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    estimatedUnitPrice: item.estimatedUnitPrice ?? null,
    ourUnitPrice: item.ourUnitPrice ?? null,
    finalUnitPrice: item.finalUnitPrice ?? null,
    status: item.status,
    variantId: item.variantId?.toString() ?? null,
    matchConfidence: item.matchConfidence ?? null,
    quotaType: item.quotaType ?? null,
    notes: item.notes ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? null,
  };
}
