import type { OverdueAction } from '@/entities/finance/overdue-action';

export interface OverdueActionDTO {
  id: string;
  tenantId: string;
  entryId: string;
  stepId?: string;
  channel: string;
  status: string;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

export function overdueActionToDTO(action: OverdueAction): OverdueActionDTO {
  return {
    id: action.id.toString(),
    tenantId: action.tenantId.toString(),
    entryId: action.entryId.toString(),
    stepId: action.stepId?.toString(),
    channel: action.channel,
    status: action.status,
    sentAt: action.sentAt,
    error: action.error,
    createdAt: action.createdAt,
  };
}
