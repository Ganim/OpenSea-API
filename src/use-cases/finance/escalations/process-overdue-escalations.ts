import { logger } from '@/lib/logger';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { OverdueActionsRepository } from '@/repositories/finance/overdue-actions-repository';
import type { OverdueEscalationsRepository } from '@/repositories/finance/overdue-escalations-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OverdueEscalationStep } from '@/entities/finance/overdue-escalation-step';
import type { FinanceEntry } from '@/entities/finance/finance-entry';

interface ProcessOverdueEscalationsUseCaseRequest {
  tenantId: string;
  createdBy?: string;
}

interface ProcessOverdueEscalationsUseCaseResponse {
  processed: number;
  actionsCreated: number;
  errors: string[];
}

export class ProcessOverdueEscalationsUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private escalationsRepository: OverdueEscalationsRepository,
    private overdueActionsRepository: OverdueActionsRepository,
    private notificationsRepository: NotificationsRepository,
  ) {}

  async execute(
    request: ProcessOverdueEscalationsUseCaseRequest,
  ): Promise<ProcessOverdueEscalationsUseCaseResponse> {
    const { tenantId, createdBy } = request;
    const t0 = Date.now();
    let processed = 0;
    let actionsCreated = 0;
    const errors: string[] = [];

    logger.info({ tenantId }, '[process-escalations] starting');

    // Get default escalation template for this tenant
    const escalation = await this.escalationsRepository.findDefault(tenantId);

    if (!escalation) {
      logger.info(
        { tenantId },
        '[process-escalations] no default escalation template found, skipping',
      );
      return { processed: 0, actionsCreated: 0, errors: [] };
    }

    const activeSteps = escalation.steps.filter((step) => step.isActive);
    if (activeSteps.length === 0) {
      logger.info(
        { tenantId },
        '[process-escalations] default escalation has no active steps',
      );
      return { processed: 0, actionsCreated: 0, errors: [] };
    }

    // Fetch all OVERDUE entries for this tenant
    const { entries: overdueEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        status: 'OVERDUE',
        limit: 1000,
      });

    logger.info(
      { tenantId, overdueCount: overdueEntries.length },
      '[process-escalations] overdue entries found',
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const entry of overdueEntries) {
      processed++;

      const daysOverdue = Math.floor(
        (today.getTime() - entry.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Determine which steps should fire for this entry's daysOverdue
      const applicableSteps = activeSteps.filter(
        (step) => daysOverdue >= step.daysOverdue,
      );

      for (const step of applicableSteps) {
        try {
          // Check if this step was already executed for this entry
          const existingAction =
            await this.overdueActionsRepository.findByEntryAndStep(
              entry.id.toString(),
              step.id.toString(),
              tenantId,
            );

          if (existingAction) {
            continue; // Already executed, skip
          }

          // Render the message with placeholders
          const renderedMessage = this.renderTemplate(
            step.message,
            entry,
            daysOverdue,
          );
          const renderedSubject = step.subject
            ? this.renderTemplate(step.subject, entry, daysOverdue)
            : undefined;

          // Create the overdue action
          await this.overdueActionsRepository.create({
            tenantId,
            entryId: entry.id.toString(),
            stepId: step.id.toString(),
            channel: step.channel,
            status: this.resolveInitialStatus(step),
          });

          actionsCreated++;

          // Handle channel-specific actions
          await this.handleChannelAction(
            step,
            entry,
            renderedMessage,
            renderedSubject,
            tenantId,
            createdBy,
          );
        } catch (stepError) {
          const errorMessage = `Failed to process step ${step.id.toString()} for entry ${entry.code}: ${stepError instanceof Error ? stepError.message : String(stepError)}`;
          errors.push(errorMessage);
          logger.error(
            {
              tenantId,
              stepId: step.id.toString(),
              entryId: entry.id.toString(),
              error: stepError,
            },
            '[process-escalations] step processing failed',
          );
        }
      }
    }

    logger.info(
      {
        tenantId,
        processed,
        actionsCreated,
        errorsCount: errors.length,
        elapsedMs: Date.now() - t0,
      },
      '[process-escalations] completed',
    );

    return { processed, actionsCreated, errors };
  }

  private renderTemplate(
    template: string,
    entry: FinanceEntry,
    daysOverdue: number,
  ): string {
    const formattedAmount = entry.expectedAmount.toFixed(2);
    const formattedDueDate = this.formatDate(entry.dueDate);

    return template
      .replace(/{customerName}/g, entry.customerName ?? 'Cliente')
      .replace(/{supplierName}/g, entry.supplierName ?? 'Fornecedor')
      .replace(/{amount}/g, formattedAmount)
      .replace(/{dueDate}/g, formattedDueDate)
      .replace(/{daysPastDue}/g, String(daysOverdue))
      .replace(/{entryCode}/g, entry.code)
      .replace(/{description}/g, entry.description);
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private resolveInitialStatus(
    step: OverdueEscalationStep,
  ): 'PENDING' | 'SENT' {
    // INTERNAL_NOTE and SYSTEM_ALERT are processed immediately
    if (step.channel === 'INTERNAL_NOTE' || step.channel === 'SYSTEM_ALERT') {
      return 'SENT';
    }
    // EMAIL and WHATSAPP are queued for external delivery
    return 'PENDING';
  }

  private async handleChannelAction(
    step: OverdueEscalationStep,
    entry: FinanceEntry,
    renderedMessage: string,
    renderedSubject: string | undefined,
    tenantId: string,
    createdBy?: string,
  ): Promise<void> {
    switch (step.channel) {
      case 'SYSTEM_ALERT': {
        if (createdBy) {
          await this.notificationsRepository.create({
            userId: new UniqueEntityID(createdBy),
            title: renderedSubject ?? `Alerta de cobrança: ${entry.code}`,
            message: renderedMessage,
            type: 'WARNING',
            priority: 'HIGH',
            channel: 'IN_APP',
            entityType: 'finance_entry',
            entityId: entry.id.toString(),
          });
        }
        break;
      }
      case 'INTERNAL_NOTE': {
        // Internal notes are stored as overdue actions with SENT status
        // The UI can display these in the entry's escalation history
        logger.info(
          {
            tenantId,
            entryId: entry.id.toString(),
            channel: 'INTERNAL_NOTE',
          },
          '[process-escalations] internal note recorded',
        );
        break;
      }
      case 'EMAIL':
      case 'WHATSAPP': {
        // EMAIL and WHATSAPP are queued as PENDING actions
        // External systems pick them up for actual delivery
        logger.info(
          {
            tenantId,
            entryId: entry.id.toString(),
            channel: step.channel,
          },
          '[process-escalations] action queued for external delivery',
        );
        break;
      }
    }
  }
}
