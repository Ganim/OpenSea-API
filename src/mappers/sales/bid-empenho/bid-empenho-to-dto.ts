import type { BidEmpenho } from '@/entities/sales/bid-empenho';

export interface BidEmpenhoDTO {
  id: string;
  tenantId: string;
  contractId: string;
  empenhoNumber: string;
  type: string;
  value: number;
  issueDate: Date;
  status: string;
  orderId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export function bidEmpenhoToDTO(empenho: BidEmpenho): BidEmpenhoDTO {
  return {
    id: empenho.id.toString(),
    tenantId: empenho.tenantId.toString(),
    contractId: empenho.contractId.toString(),
    empenhoNumber: empenho.empenhoNumber,
    type: empenho.type,
    value: empenho.value,
    issueDate: empenho.issueDate,
    status: empenho.status,
    orderId: empenho.orderId?.toString() ?? null,
    notes: empenho.notes ?? null,
    createdAt: empenho.createdAt,
    updatedAt: empenho.updatedAt ?? null,
  };
}
