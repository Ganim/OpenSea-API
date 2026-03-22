import type { BidHistory } from '@/entities/sales/bid-history';

export interface BidHistoryDTO {
  id: string;
  bidId: string;
  tenantId: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  performedByUserId: string | null;
  performedByAi: boolean;
  isReversible: boolean;
  createdAt: Date;
}

export function bidHistoryToDTO(history: BidHistory): BidHistoryDTO {
  return {
    id: history.id.toString(),
    bidId: history.bidId.toString(),
    tenantId: history.tenantId.toString(),
    action: history.action,
    description: history.description,
    metadata: history.metadata ?? null,
    performedByUserId: history.performedByUserId?.toString() ?? null,
    performedByAi: history.performedByAi,
    isReversible: history.isReversible,
    createdAt: history.createdAt,
  };
}
