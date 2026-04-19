import { logger } from '@/lib/logger';
import { NotificationPriority } from '@/modules/notifications/public';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { ModuleNotifier } from '@/use-cases/shared/helpers/module-notifier';

export type FinanceEntryNotificationCategory =
  | 'finance.entry_overdue'
  | 'finance.entry_due_3d'
  | 'finance.entry_due_today';

interface CheckOverdueEntriesUseCaseRequest {
  tenantId: string;
  dueSoonDays?: number;
  createdBy?: string;
}

interface CheckOverdueEntriesUseCaseResponse {
  markedOverdue: number;
  payableOverdue: number;
  receivableOverdue: number;
  dueSoonAlerts: number;
}

export class CheckOverdueEntriesUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private notifier: ModuleNotifier<FinanceEntryNotificationCategory>,
  ) {}

  async execute(
    request: CheckOverdueEntriesUseCaseRequest,
  ): Promise<CheckOverdueEntriesUseCaseResponse> {
    const { tenantId, dueSoonDays = 3, createdBy } = request;
    const now = new Date();

    let markedOverdue = 0;
    let payableOverdue = 0;
    let receivableOverdue = 0;
    let dueSoonAlerts = 0;

    const t0 = Date.now();
    logger.info({ tenantId, createdBy }, '[check-overdue] starting');

    const todayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const { entries: overdueEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        status: 'PENDING',
        dueDateTo: todayUtc,
        limit: 1000,
      });

    const today = todayUtc;
    const actuallyOverdue = overdueEntries.filter((e) => e.dueDate < today);

    logger.info(
      {
        tenantId,
        overdueCount: actuallyOverdue.length,
        fetchedCount: overdueEntries.length,
      },
      '[check-overdue] entries to process',
    );

    for (const entry of actuallyOverdue) {
      await this.financeEntriesRepository.update({
        id: entry.id,
        tenantId,
        status: 'OVERDUE',
      });
      markedOverdue++;

      if (entry.type === 'PAYABLE') {
        payableOverdue++;
      } else {
        receivableOverdue++;
      }

      if (createdBy) {
        const isPayable = entry.type === 'PAYABLE';
        const customerInfo =
          !isPayable && entry.customerName ? ` de ${entry.customerName}` : '';
        await this.notifier.dispatch({
          category: 'finance.entry_overdue',
          tenantId,
          recipientUserId: createdBy,
          title: isPayable ? 'Despesa atrasada' : 'Recebimento atrasado',
          body: `${isPayable ? 'Despesa' : 'Recebimento'} atrasado: ${entry.description}${customerInfo}, vencido em ${this.formatDate(entry.dueDate)}. Valor: R$ ${entry.expectedAmount.toFixed(2)}`,
          priority: NotificationPriority.HIGH,
          entityType: 'finance_entry',
          entityId: entry.id.toString(),
          actionUrl: `/finance/entries/${entry.id.toString()}`,
        });
      }
    }

    const dueSoonDate = new Date(today);
    dueSoonDate.setUTCDate(dueSoonDate.getUTCDate() + dueSoonDays);

    const { entries: dueSoonEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        status: 'PENDING',
        dueDateFrom: today,
        dueDateTo: dueSoonDate,
        limit: 1000,
      });

    for (const entry of dueSoonEntries) {
      const daysUntilDue = Math.ceil(
        (entry.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilDue <= 0) continue;

      dueSoonAlerts++;

      if (createdBy) {
        const isPayable = entry.type === 'PAYABLE';
        const customerInfo =
          !isPayable && entry.customerName ? ` de ${entry.customerName}` : '';
        await this.notifier.dispatch({
          category: 'finance.entry_due_3d',
          tenantId,
          recipientUserId: createdBy,
          title: isPayable
            ? 'Despesa próxima do vencimento'
            : 'Recebimento próximo do vencimento',
          body: `${isPayable ? 'Despesa' : 'Recebimento'} vence em ${daysUntilDue} dias: ${entry.description}${customerInfo}. Valor: R$ ${entry.expectedAmount.toFixed(2)}`,
          priority: NotificationPriority.NORMAL,
          entityType: 'finance_entry',
          entityId: entry.id.toString(),
          actionUrl: `/finance/entries/${entry.id.toString()}`,
        });
      }
    }

    logger.info(
      {
        tenantId,
        markedOverdue,
        payableOverdue,
        receivableOverdue,
        dueSoonAlerts,
        elapsedMs: Date.now() - t0,
      },
      '[check-overdue] completed',
    );

    return {
      markedOverdue,
      payableOverdue,
      receivableOverdue,
      dueSoonAlerts,
    };
  }

  private formatDate(date: Date): string {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
}
