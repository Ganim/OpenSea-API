import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';

interface CheckOverdueEntriesUseCaseRequest {
  tenantId: string;
  dueSoonDays?: number; // default 3
  createdBy?: string; // userId who triggered the check
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
    private notificationsRepository: NotificationsRepository,
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

    // Step 1: Find PENDING entries with dueDate < today and mark as OVERDUE
    const { entries: overdueEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        status: 'PENDING',
        dueDateTo: new Date(now.getFullYear(), now.getMonth(), now.getDate()), // today start
        limit: 1000,
      });

    // Filter only actually overdue (dueDate strictly before today)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const actuallyOverdue = overdueEntries.filter((e) => e.dueDate < today);

    for (const entry of actuallyOverdue) {
      await this.financeEntriesRepository.update({
        id: entry.id,
        status: 'OVERDUE',
      });
      markedOverdue++;

      if (entry.type === 'PAYABLE') {
        payableOverdue++;
        // Create notification for payable overdue
        if (createdBy) {
          await this.notificationsRepository.create({
            userId: new UniqueEntityID(createdBy),
            title: 'Despesa atrasada',
            message: `Despesa atrasada: ${entry.description}, vencida em ${this.formatDate(entry.dueDate)}. Valor: R$ ${entry.expectedAmount.toFixed(2)}`,
            type: 'WARNING',
            priority: 'HIGH',
            channel: 'IN_APP',
            entityType: 'finance_entry',
            entityId: entry.id.toString(),
          });
        }
      } else {
        receivableOverdue++;
        // Create notification for receivable overdue (include customer name)
        if (createdBy) {
          const customerInfo = entry.customerName
            ? ` de ${entry.customerName}`
            : '';
          await this.notificationsRepository.create({
            userId: new UniqueEntityID(createdBy),
            title: 'Recebimento atrasado',
            message: `Recebimento atrasado: ${entry.description}${customerInfo}, vencido em ${this.formatDate(entry.dueDate)}. Valor: R$ ${entry.expectedAmount.toFixed(2)}`,
            type: 'WARNING',
            priority: 'HIGH',
            channel: 'IN_APP',
            entityType: 'finance_entry',
            entityId: entry.id.toString(),
          });
        }
      }
    }

    // Step 2: Find PENDING entries due within dueSoonDays and create DUE_SOON alerts
    const dueSoonDate = new Date(today);
    dueSoonDate.setDate(dueSoonDate.getDate() + dueSoonDays);

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

      if (daysUntilDue <= 0) continue; // skip entries due today (not "soon")

      dueSoonAlerts++;

      if (createdBy) {
        if (entry.type === 'PAYABLE') {
          await this.notificationsRepository.create({
            userId: new UniqueEntityID(createdBy),
            title: 'Despesa próxima do vencimento',
            message: `Despesa vence em ${daysUntilDue} dias: ${entry.description}. Valor: R$ ${entry.expectedAmount.toFixed(2)}`,
            type: 'REMINDER',
            priority: 'NORMAL',
            channel: 'IN_APP',
            entityType: 'finance_entry',
            entityId: entry.id.toString(),
          });
        } else {
          const customerInfo = entry.customerName
            ? ` de ${entry.customerName}`
            : '';
          await this.notificationsRepository.create({
            userId: new UniqueEntityID(createdBy),
            title: 'Recebimento próximo do vencimento',
            message: `Recebimento vence em ${daysUntilDue} dias: ${entry.description}${customerInfo}. Valor: R$ ${entry.expectedAmount.toFixed(2)}`,
            type: 'REMINDER',
            priority: 'NORMAL',
            channel: 'IN_APP',
            entityType: 'finance_entry',
            entityId: entry.id.toString(),
          });
        }
      }
    }

    return {
      markedOverdue,
      payableOverdue,
      receivableOverdue,
      dueSoonAlerts,
    };
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}
