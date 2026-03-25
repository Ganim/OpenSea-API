import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OverdueEscalation } from '@/entities/finance/overdue-escalation';
import { OverdueEscalationStep } from '@/entities/finance/overdue-escalation-step';
import type {
  OverdueEscalation as PrismaOverdueEscalation,
  OverdueEscalationStep as PrismaOverdueEscalationStep,
} from '@prisma/generated/client.js';

export function overdueEscalationStepPrismaToDomain(
  raw: PrismaOverdueEscalationStep,
): OverdueEscalationStep {
  return OverdueEscalationStep.create(
    {
      id: new UniqueEntityID(raw.id),
      escalationId: new UniqueEntityID(raw.escalationId),
      daysOverdue: raw.daysOverdue,
      channel: raw.channel,
      templateType: raw.templateType,
      subject: raw.subject ?? undefined,
      message: raw.message,
      isActive: raw.isActive,
      order: raw.order,
    },
    new UniqueEntityID(raw.id),
  );
}

export function overdueEscalationPrismaToDomain(
  raw: PrismaOverdueEscalation & {
    steps?: PrismaOverdueEscalationStep[];
  },
): OverdueEscalation {
  return OverdueEscalation.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      name: raw.name,
      isDefault: raw.isDefault,
      isActive: raw.isActive,
      steps: (raw.steps ?? []).map(overdueEscalationStepPrismaToDomain),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}
