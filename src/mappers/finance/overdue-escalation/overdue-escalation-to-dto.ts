import type { OverdueEscalation } from '@/entities/finance/overdue-escalation';
import type { OverdueEscalationStep } from '@/entities/finance/overdue-escalation-step';

export interface OverdueEscalationStepDTO {
  id: string;
  escalationId: string;
  daysOverdue: number;
  channel: string;
  templateType: string;
  subject?: string;
  message: string;
  isActive: boolean;
  order: number;
}

export interface OverdueEscalationDTO {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  steps: OverdueEscalationStepDTO[];
  createdAt: Date;
  updatedAt?: Date;
}

export function overdueEscalationStepToDTO(
  step: OverdueEscalationStep,
): OverdueEscalationStepDTO {
  return {
    id: step.id.toString(),
    escalationId: step.escalationId.toString(),
    daysOverdue: step.daysOverdue,
    channel: step.channel,
    templateType: step.templateType,
    subject: step.subject,
    message: step.message,
    isActive: step.isActive,
    order: step.order,
  };
}

export function overdueEscalationToDTO(
  escalation: OverdueEscalation,
): OverdueEscalationDTO {
  return {
    id: escalation.id.toString(),
    tenantId: escalation.tenantId.toString(),
    name: escalation.name,
    isDefault: escalation.isDefault,
    isActive: escalation.isActive,
    steps: escalation.steps.map(overdueEscalationStepToDTO),
    createdAt: escalation.createdAt,
    updatedAt: escalation.updatedAt,
  };
}
