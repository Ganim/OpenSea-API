import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EscalationChannel } from '@/entities/finance/overdue-escalation-types';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { OverdueActionsRepository } from '@/repositories/finance/overdue-actions-repository';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';

type TimelineStepStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'SCHEDULED';

export interface EscalationTimelineStep {
  stepNumber: number;
  type: string;
  status: TimelineStepStatus;
  scheduledDate?: string;
  executedDate?: string;
  channel: string;
  description: string;
  messagePreview?: string;
}

interface GetEscalationTimelineUseCaseRequest {
  tenantId: string;
  entryId: string;
}

interface GetEscalationTimelineUseCaseResponse {
  entryId: string;
  currentStep: number;
  totalSteps: number;
  steps: EscalationTimelineStep[];
}

export class GetEscalationTimelineUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private overdueActionsRepository: OverdueActionsRepository,
    private overdueEscalationsRepository: OverdueEscalationsRepository,
  ) {}

  async execute(
    request: GetEscalationTimelineUseCaseRequest,
  ): Promise<GetEscalationTimelineUseCaseResponse> {
    const { entryId, tenantId } = request;

    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const escalation =
      await this.overdueEscalationsRepository.findDefault(tenantId);

    if (!escalation) {
      return {
        entryId,
        currentStep: 0,
        totalSteps: 0,
        steps: [],
      };
    }

    const activeSteps = escalation.steps
      .filter((step) => step.isActive)
      .sort((a, b) => a.order - b.order);

    if (activeSteps.length === 0) {
      return {
        entryId,
        currentStep: 0,
        totalSteps: 0,
        steps: [],
      };
    }

    const executedActions = await this.overdueActionsRepository.findByEntryId(
      entryId,
      tenantId,
    );

    const executedActionsByStepId = new Map(
      executedActions
        .filter((action) => action.stepId)
        .map((action) => [action.stepId!.toString(), action]),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(entry.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const daysOverdue = Math.max(
      0,
      Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)),
    );

    let currentStep = 0;
    const timelineSteps: EscalationTimelineStep[] = [];

    for (let index = 0; index < activeSteps.length; index++) {
      const step = activeSteps[index];
      const stepNumber = index + 1;
      const stepId = step.id.toString();
      const executedAction = executedActionsByStepId.get(stepId);

      const scheduledDate = new Date(dueDate);
      scheduledDate.setDate(scheduledDate.getDate() + step.daysOverdue);

      const channelLabel = this.getChannelLabel(step.channel);
      const templateLabel = this.getTemplateLabel(step.templateType);

      const messagePreview =
        step.message.length > 120
          ? `${step.message.substring(0, 120)}...`
          : step.message;

      if (executedAction) {
        const actionStatus = executedAction.status;
        let timelineStatus: TimelineStepStatus;

        if (actionStatus === 'SENT') {
          timelineStatus = 'COMPLETED';
          currentStep = stepNumber;
        } else if (actionStatus === 'FAILED') {
          timelineStatus = 'FAILED';
          currentStep = stepNumber;
        } else {
          timelineStatus = 'PENDING';
          if (currentStep < stepNumber) {
            currentStep = stepNumber;
          }
        }

        timelineSteps.push({
          stepNumber,
          type: step.templateType,
          status: timelineStatus,
          scheduledDate: scheduledDate.toISOString(),
          executedDate: executedAction.sentAt
            ? executedAction.sentAt.toISOString()
            : executedAction.createdAt.toISOString(),
          channel: channelLabel,
          description: `${templateLabel} via ${channelLabel} (${step.daysOverdue} dias após vencimento)`,
          messagePreview,
        });
      } else {
        const isScheduled = daysOverdue >= step.daysOverdue;

        timelineSteps.push({
          stepNumber,
          type: step.templateType,
          status: isScheduled ? 'PENDING' : 'SCHEDULED',
          scheduledDate: scheduledDate.toISOString(),
          channel: channelLabel,
          description: `${templateLabel} via ${channelLabel} (${step.daysOverdue} dias após vencimento)`,
          messagePreview,
        });
      }
    }

    return {
      entryId,
      currentStep,
      totalSteps: activeSteps.length,
      steps: timelineSteps,
    };
  }

  private getChannelLabel(channel: EscalationChannel): string {
    const labels: Record<EscalationChannel, string> = {
      EMAIL: 'E-mail',
      WHATSAPP: 'WhatsApp',
      INTERNAL_NOTE: 'Nota Interna',
      SYSTEM_ALERT: 'Alerta do Sistema',
    };
    return labels[channel] ?? channel;
  }

  private getTemplateLabel(templateType: string): string {
    const labels: Record<string, string> = {
      FRIENDLY_REMINDER: 'Lembrete Amigável',
      FORMAL_NOTICE: 'Notificação Formal',
      URGENT_NOTICE: 'Aviso Urgente',
      FINAL_NOTICE: 'Aviso Final',
    };
    return labels[templateType] ?? templateType;
  }
}
