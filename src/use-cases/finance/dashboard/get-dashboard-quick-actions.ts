import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankReconciliationsRepository } from '@/repositories/finance/bank-reconciliations-repository';

interface GetDashboardQuickActionsUseCaseRequest {
  tenantId: string;
}

interface QuickAction {
  type:
    | 'OVERDUE_PAYMENT'
    | 'UPCOMING_DUE'
    | 'PENDING_APPROVAL'
    | 'UNRECONCILED';
  title: string;
  count: number;
  totalAmount: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  actionUrl: string;
}

interface DashboardQuickActionsSummary {
  overdueCount: number;
  overdueAmount: number;
  upcomingCount: number;
  upcomingAmount: number;
  pendingApprovalCount: number;
  unreconciledCount: number;
}

interface GetDashboardQuickActionsUseCaseResponse {
  actions: QuickAction[];
  summary: DashboardQuickActionsSummary;
}

export class GetDashboardQuickActionsUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankReconciliationsRepository: BankReconciliationsRepository,
  ) {}

  async execute(
    request: GetDashboardQuickActionsUseCaseRequest,
  ): Promise<GetDashboardQuickActionsUseCaseResponse> {
    const { tenantId } = request;

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [
      overduePayableResult,
      overdueReceivableResult,
      upcomingPayableEntries,
      upcomingReceivableEntries,
      scheduledEntries,
      unreconciledReconciliations,
    ] = await Promise.all([
      this.financeEntriesRepository.sumOverdue(tenantId, 'PAYABLE'),
      this.financeEntriesRepository.sumOverdue(tenantId, 'RECEIVABLE'),
      this.financeEntriesRepository.findMany({
        tenantId,
        status: 'PENDING',
        type: 'PAYABLE',
        dueDateFrom: now,
        dueDateTo: threeDaysFromNow,
        limit: 1000,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        status: 'PENDING',
        type: 'RECEIVABLE',
        dueDateFrom: now,
        dueDateTo: threeDaysFromNow,
        limit: 1000,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        status: 'SCHEDULED',
        limit: 1000,
      }),
      this.bankReconciliationsRepository.findMany({
        tenantId,
        status: 'IN_PROGRESS',
        limit: 1000,
      }),
    ]);

    const overdueCount =
      overduePayableResult.count + overdueReceivableResult.count;
    const overdueAmount =
      overduePayableResult.total + overdueReceivableResult.total;

    const upcomingEntries = [
      ...upcomingPayableEntries.entries,
      ...upcomingReceivableEntries.entries,
    ];
    const upcomingCount = upcomingEntries.length;
    const upcomingAmount = upcomingEntries.reduce(
      (sum, entry) => sum + entry.expectedAmount,
      0,
    );

    const pendingApprovalCount = scheduledEntries.total;
    const unreconciledCount = unreconciledReconciliations.total;

    const actions: QuickAction[] = [];

    if (overdueCount > 0) {
      actions.push({
        type: 'OVERDUE_PAYMENT',
        title: `${overdueCount} lançamento(s) em atraso`,
        count: overdueCount,
        totalAmount: Math.round(overdueAmount * 100) / 100,
        urgency: 'HIGH',
        actionUrl: '/finance/entries?status=OVERDUE',
      });
    }

    if (upcomingCount > 0) {
      actions.push({
        type: 'UPCOMING_DUE',
        title: `${upcomingCount} vencimento(s) nos próximos 3 dias`,
        count: upcomingCount,
        totalAmount: Math.round(upcomingAmount * 100) / 100,
        urgency: 'MEDIUM',
        actionUrl: '/finance/entries?status=PENDING&dueSoon=true',
      });
    }

    if (pendingApprovalCount > 0) {
      actions.push({
        type: 'PENDING_APPROVAL',
        title: `${pendingApprovalCount} lançamento(s) aguardando aprovação`,
        count: pendingApprovalCount,
        totalAmount: 0,
        urgency: 'MEDIUM',
        actionUrl: '/finance/entries?status=SCHEDULED',
      });
    }

    if (unreconciledCount > 0) {
      actions.push({
        type: 'UNRECONCILED',
        title: `${unreconciledCount} conciliação(ões) em andamento`,
        count: unreconciledCount,
        totalAmount: 0,
        urgency: 'LOW',
        actionUrl: '/finance/reconciliation',
      });
    }

    return {
      actions,
      summary: {
        overdueCount,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        upcomingCount,
        upcomingAmount: Math.round(upcomingAmount * 100) / 100,
        pendingApprovalCount,
        unreconciledCount,
      },
    };
  }
}
