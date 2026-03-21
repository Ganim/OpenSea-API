import type { Deal } from '@/entities/sales/deal';

export interface DealDTO {
  id: string;
  tenantId: string;
  title: string;
  customerId: string;
  contactId: string | null;
  pipelineId: string;
  stageId: string;
  status: string;
  priority: string;
  value: number | null;
  currency: string;
  expectedCloseDate: Date | null;
  closedAt: Date | null;
  lostReason: string | null;
  source: string | null;
  tags: string[];
  customFields: Record<string, unknown> | null;
  position: number;
  assignedToUserId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function dealToDTO(deal: Deal): DealDTO {
  return {
    id: deal.id.toString(),
    tenantId: deal.tenantId.toString(),
    title: deal.title,
    customerId: deal.customerId.toString(),
    contactId: deal.contactId?.toString() ?? null,
    pipelineId: deal.pipelineId.toString(),
    stageId: deal.stageId.toString(),
    status: deal.status,
    priority: deal.priority,
    value: deal.value ?? null,
    currency: deal.currency,
    expectedCloseDate: deal.expectedCloseDate ?? null,
    closedAt: deal.closedAt ?? null,
    lostReason: deal.lostReason ?? null,
    source: deal.source ?? null,
    tags: deal.tags,
    customFields: deal.customFields ?? null,
    position: deal.position,
    assignedToUserId: deal.assignedToUserId?.toString() ?? null,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt ?? null,
    deletedAt: deal.deletedAt ?? null,
  };
}
